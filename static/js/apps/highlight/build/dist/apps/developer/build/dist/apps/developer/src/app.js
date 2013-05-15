define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'text!apps/developer/src/app.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    app_template) {
    
    /**
     * Developer application router.
     */
    var DeveloperAppRouter = Backbone.Router.extend({
        routes: {
            'profile': 'profile',
            '*actions': 'profile'

        },
        
        initialize: function(options) {
            this.facade = options.facade;

        },
        
        ensureMediator:  function(mediatorClass) {
            var mediator = this.facade.getMediator(mediatorClass.NAME);
            if(!mediator) {
                mediator = new mediatorClass();
                this.facade.registerMediator(mediator);
            }
            return mediator;
        },

        profile: function() {
        }
    });

    /**
     * Navigate Command
     */
    var NavigateCommand = core.command.Command.extend({
        execute: function(options) {
            var uri;
            options = _.extend({
                trigger: true
            }, options);
            router = this.facade.router;
            
            switch(options.type) {
            }
        }
    });
    
    /**
     * Developer application main view.
     * @constructor
     * @param {Object} options 
     */
    var DeveloperAppView = core.view.View.extend({
        

        initialize: function() {
            this.template = _.template(app_template);
            this.activeView = null;
        },

        render: function() {
            this.$el.html(this.template());
            return this;
        },

        addView: function(type, view, options) {
            if(view.isModal()) {
                this.append(view);
            } else if(view.isAlert()) {
                this.html(view, '#alerts');
            } else {
                switch(type) {
                    default:
                        if(this.activeView) {
                            this._destroyView(this.activeView);
                        }
                        this.html(view, '#content');
                        $('html,body').scrollTop(0);
                        this.activeView = {
                            type: type,
                            view: view,
                            options: options
                        };
                        break;
                }
            }
        },

        _destroyView: function(activeView) {
            this.triggerEvent(DeveloperAppView.EVENTS.DESTROY_VIEW, activeView);
        }

    }, {
        EVENTS: {
            DESTROY_VIEW: 'talent:destroyView'
        }
    });
   
    /**
     * Event to Notification map
     */
    var EventNotificationMap = {};

    /**
     * Developer App Mediator
     * @constructor
     * @param {Object} options
     */
    var DeveloperAppMediator = core.mediator.Mediator.extend({
        name: 'DeveloperAppMediator',
        
        /**
         * Notification handlers
         */
        notifications: [
            [core.notifications.DOM_READY, 'onDomReady'],
            [core.notifications.VIEW_CREATED, 'onViewCreated']
        ],

        initialize: function(options) {
            this.view = new DeveloperAppView(options);
            this.view.render();

            this.view.addEventListener(this.cid, DeveloperAppView.EVENTS.DESTROY_VIEW, this.onDestroyView, this);
            _.each(EventNotificationMap, function(notificationName, eventName) {
                this.view.addEventListener(this.cid, eventName, this.onNotificationEvent, this);
            }, this);

            //create and register sub-mediators
        },

        onDomReady: function(notification) {
            $('#app').append(this.view.el);
        },

        onViewCreated: function(notification) {
            this.view.addView(notification.type, notification.view, notification.options);
        },

        onDestroyView: function(e, eventBody) {
            this.facade.trigger(notifications.VIEW_DESTROY, eventBody);
        },

        onNotificationEvent: function(e, eventBody) {
            var notification = EventNotificationMap[e.type];
            if(notification) {
                this.facade.trigger(notification, eventBody);
            }
        }
    });

    /**
     * Init Models Command
     * @constructor
     * Registers Proxies.
     */
    var InitModels = core.command.Command.extend({

        execute: function() {
            /*
            this.facade.registerProxy(new current_proxies.CurrentProxy({
                user: TR.CURRENT_USER
            }));
            this.facade.registerProxy(new player_proxies.PlayerStateProxy({
                model: new player_models.PlayerState()
            }));
            */
        }
    });

    /**
     * Init Views Command
     * @constructor
     * Creates DeveloperAppMediator main app view and sub-mediators
     * which in turn create additional views.
     */
    var InitViews = core.command.Command.extend({

        execute: function() {
            this.facade.registerMediator(new DeveloperAppMediator());
            //this.facade.registerMediator(new alert_mediators.AlertMediator());
        }
    });

    /**
     * App Start Command
     * @constructor
     * Initializes models (proxies) and views (mediators)
     */
    var AppStartCommand = core.command.MacroCommand.extend({

        initialize: function() {
            this.addSubCommand(InitModels);
            this.addSubCommand(InitViews);
        }
    });


    /**
     * Developer App Facade
     * Concrete applicaion facade which facilitates communication
     * between disparate parts of the system through notifications.
     * 
     * This facade must be instantiated first.
     * (before any commands, mediators, or proxies).
     */
    var DeveloperAppFacade = core.facade.Facade.extend({

        initialize: function() {
            //register facade instance
            core.facade.setInstance(this);
            
            //create router
            this.router = new DeveloperAppRouter({
                facade: this
            });


            //register commands
            this.registerCommand(core.notifications.APP_START, AppStartCommand);
            this.registerCommand(core.notifications.VIEW_NAVIGATE, NavigateCommand);
            
            /* APPLICATION COMMANDS */
        },
        
        /**
         * Initialize router and history. 
         * This should not be called until dom is ready, since i.e. hash-based
         * history relies on an iframe.
         */
        initializeRouter: function() {
            //var pushState = !!(window.history && window.history.pushState);
            Backbone.history.start({
                pushState: true,
                root: '/talent/'
            });
            
            var that = this;

            $(document).on('click', 'a:not([data-bypass])', function(e) {
                var root = '/developer';
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
            this.trigger(core.notifications.APP_START, TR.data);
        },
        
        /**
         * Stop the application.
         */
        stop: function() {
            this.trigger(notifications.APP_STOP);
        }
    });

    //one and only concrete facade
    var developerAppFacade = new DeveloperAppFacade();

    //start the app
    developerAppFacade.start();

    //DOM ready notification
    $(document).ready(function() {
        developerAppFacade.initializeRouter();
        developerAppFacade.trigger(core.notifications.DOM_READY);
        require(['ui'], function(u) {console.log('ui');});
    });

    return 'blah';
});
