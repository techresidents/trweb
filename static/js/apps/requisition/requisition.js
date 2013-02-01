define([
    'jquery',
    'underscore',
    'backbone',
    'common/notifications',
    'core/command',
    'core/facade',
    'core/mediator',
    'core/view',
    'current/proxies',
    'requisition/req/mediators',
    'requisition/list/mediators',
    'text!apps/requisition/requisition.html'
], function(
    $,
    _,
    Backbone,
    notifications,
    command,
    facade,
    mediator,
    view,
    current_proxies,
    requisition_mediators,
    requisition_list_mediators,
    requisition_app_template) {

    /**
     * Requisition application router.
     */
    var RequisitionAppRouter = Backbone.Router.extend({
        routes: {
            'create': 'create',
            'req/:id': 'requisition',
            '*list': 'list'

        },

        initialize: function(options) {
            this.facade = options.facade;

        },

        create: function() {
            this.facade.trigger(notifications.VIEW_CREATE, {
                type: requisition_mediators.RequisitionMediator.VIEW_TYPE,
                options: {}
            });
        },

        requisition: function(id) {
            this.facade.trigger(notifications.VIEW_CREATE, {
                type: requisition_mediators.RequisitionMediator.VIEW_TYPE,
                options: {
                    id: id
                }
            });
        },

        list: function() {
            this.facade.trigger(notifications.VIEW_CREATE, {
                type: requisition_list_mediators.RequisitionListMediator.VIEW_TYPE,
                options: {}
            });
        }
    });

    /**
     * Navigate Command
     * This command should be used if it's needed to redirect
     * to another URL due to some event (e.g. something other
     * than a click on a URL by a user).
     */
    var NavigateCommand = command.Command.extend({

        execute: function(options) {
            router = this.facade.router;
            switch(options.type) {
                case requisition_mediators.RequisitionMediator.VIEW_TYPE:
                    var reqId = options.options.id;
                    if (!reqId) {
                        router.navigate("create", {trigger: true});
                    } else {
                        router.navigate("req/" + reqId, {trigger: true});
                    }
                    break;
                case requisition_list_mediators.RequisitionListMediator.VIEW_TYPE:
                    router.navigate("list", {trigger: true});
                    break;
            }
        }
    });

    /**
     * Requisition application main view.
     * @constructor
     * @param {Object} options
     */
    var RequisitionAppView = view.View.extend({


        initialize: function() {
            this.template = _.template(requisition_app_template);
            this.activeView = null;
        },

        render: function() {
            this.$el.html(this.template());
            return this;
        },

        addView: function(type, view, options) {
            switch(type) {
                case 'AlertView':
                    this.$('#alerts').append(view.render().el);
                    break;
                default:
                    if(this.activeView) {
                        this._destroyView(this.activeView);
                    }
                    this.$('#content').append(view.render().el);
                    this.activeView = {
                        type: type,
                        view: view,
                        options: options
                    };
                    break;
            }
        },

        // TODO why not trigger notification here?
        _destroyView: function(activeView) {
            this.triggerEvent(RequisitionAppView.EVENTS.DESTROY_VIEW, activeView);
        }

    }, {
        EVENTS: {
            DESTROY_VIEW: 'requisition:destroyView'
        }
    });


    /**
     * Requisition App Mediator
     * @constructor
     * @param {Object} options
     */
    var RequisitionAppMediator = mediator.Mediator.extend({
        name: 'RequisitionAppMediator',

        /**
         * Notification handlers
         */
        notifications: [
            [notifications.DOM_READY, 'onDomReady'],
            [notifications.VIEW_CREATED, 'onViewCreated']
        ],

        initialize: function(options) {
            this.view = new RequisitionAppView(options);
            this.view.render();

            this.view.addEventListener(RequisitionAppView.EVENTS.DESTROY_VIEW, this.onDestroyView, this);

            //create and register sub-mediators
            this.facade.registerMediator(new requisition_list_mediators.RequisitionListMediator());
            this.facade.registerMediator(new requisition_mediators.RequisitionMediator());
        },

        onDomReady: function(notification) {
            $('#requisitionapp').append(this.view.el);
        },

        onViewCreated: function(notification) {
            this.view.addView(notification.type, notification.view, notification.options);
        },

        onDestroyView: function(e, eventBody) {
            this.facade.trigger(notifications.VIEW_DESTROY, eventBody);
        }
    });

    /**
     * Init Models Command
     * @constructor
     * Registers the TalentProxy, which in turn, registers
     * sub-proxies.
     */
    var InitModels = command.Command.extend({

        execute: function() {
            // Register proxies here
            this.facade.registerProxy(new current_proxies.CurrentProxy({
                user: TR.CURRENT_USER
            }));
        }
    });

    /**
     * Init Views Command
     * @constructor
     * Creates RequisitionAppMediator main app view and sub-mediators
     * which in turn create additional views.
     */
    var InitViews = command.Command.extend({

        execute: function() {
            this.facade.registerMediator(new RequisitionAppMediator(data));
        }
    });

    /**
     * App Start Command
     * @constructor
     * Initializes models (proxies) and views (mediators)
     */
    var AppStartCommand = command.MacroCommand.extend({

        initialize: function() {
            this.addSubCommand(InitModels);
            this.addSubCommand(InitViews);
        }
    });


    /**
     * Requisition App Facade
     * Concrete application facade which facilitates communication
     * between disparate parts of the system through notifications.
     *
     * This facade must be instantiated first.
     * (before any commands, mediators, or proxies).
     */
    var RequisitionAppFacade = facade.Facade.extend({

        initialize: function() {
            //register facade instance
            facade.setInstance(this);

            //create router
            this.router = new RequisitionAppRouter({
                facade: this
            });

            //register commands
            this.registerCommand(notifications.APP_START, AppStartCommand);
            this.registerCommand(notifications.VIEW_NAVIGATE, NavigateCommand);
        },

        initializeRouter: function() {
            //var pushState = !!(window.history && window.history.pushState);
            Backbone.history.start({
                pushState: true,
                root: '/requisition/'
            });

            var that = this;

            $(document).on('click', 'a:not([data-bypass])', function(e) {
                var root = '/requisition';
                var href = $(this).attr('href');
                var protocol = this.protocol + '//';

                if(href
                    && href.slice(0, protocol.length) !== protocol
                    && href.slice(0, root.length) === root) {
                    e.preventDefault();
                    that.router.navigate(href.slice(root.length, href.length), true);
                }
            });
        },

        /**
         * Start the application and connect talent.
         */
        start: function() {
            this.trigger(notifications.APP_START);
            this.initializeRouter();
        },

        /**
         * Stop the application.
         */
        stop: function() {
            this.trigger(notifications.APP_STOP);
        }
    });

    //one and only concrete facade
    var requisitionAppFacade = new RequisitionAppFacade();

    //start the app
    requisitionAppFacade.start();

    //DOM ready notification
    $(document).ready(function() {
        requisitionAppFacade.trigger(notifications.DOM_READY);
    });
});
