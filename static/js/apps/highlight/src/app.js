define([
    'jquery',
    'underscore',
    'backbone',
    'notifications',
    'core',
    'api',
    'alert',
    'apps/highlight/src/views',
    'text!apps/highlight/src/templates/highlight.html'
], function(
    $,
    _,
    Backbone,
    notifications,
    core,
    api,
    alert,
    highlight_views,
    highlight_app_template) {
    
    /**
     * Highlight application main view.
     * @constructor
     * @param {Object} options 
     *   model: User model (required)
     */
    var HighlightAppView = core.view.View.extend({

        saveStatusSelector: '.save-status',
        
        initialize: function(options) {
            this.template = _.template(highlight_app_template);
            this.model = options.model;
            this.modelLoadedWith = ['chat_sessions__chat__topic', 'highlight_sessions'];

            this.loader = new api.loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated }
            ]);

            this.loader.load({
                success: _.bind(this.render, this)
            });
        },

        render: function() {
            this.$el.html(this.template());
            this.chatSessionsView = new highlight_views.ChatSessionsView({
                el: this.$('#chat_sessions'),
                user: this.model,
                collection: this.model.get_chat_sessions(),
                highlightSessionCollection: this.model.get_highlight_sessions()
            }).render();

            this.highlightSessionsView = new highlight_views.HighlightSessionsView({
                el: this.$('#highlight_sessions'),
                collection: this.model.get_highlight_sessions()
            });
            this.highlightSessionsView.addEventListener(this.cid, highlight_views.EVENTS.DESTROY_STATUS_VIEW, this.removeStatusView, this);
            this.highlightSessionsView.render();

            return this;
        },

        addView: function(type, view, options) {
            switch(type) {
                case alert.mediators.AlertMediator.VIEW_TYPE:
                    if(this.activeStatusView) {
                        this._destroyView(this.activeStatusView);
                    }
                    this.$(this.saveStatusSelector).append(view.render().el);
                    this.activeStatusView = {
                        type: type,
                        view: view,
                        options: options
                    };
                    break;
            }
        },

        removeStatusView: function(e, eventBody) {
            if (this.activeStatusView) {
                this._destroyView(this.activeStatusView);
            }
        },

        _destroyView: function(activeView) {
            this.triggerEvent(HighlightAppView.EVENTS.DESTROY_VIEW, activeView);
        }

    },  {
        EVENTS: {
            DESTROY_VIEW: 'highlight:destroyView'
        }
    });
   
    /**
     * Highlight App Mediator
     * @constructor
     * @param {Object} options
     */
    var HighlightAppMediator = core.mediator.Mediator.extend({
        name: 'HighlightAppMediator',
        
        /**
         * Notification handlers
         */
        notifications: [
            [notifications.DOM_READY, 'onDomReady'],
            [notifications.VIEW_CREATED, 'onViewCreated']
        ],

        initialize: function(options) {
            this.userModel = new api.models.User({
                id: options.user.id
            });
            this.userModel.bootstrap(options.user);

            this.view = new HighlightAppView({
                model: this.userModel
            });
            this.view.render();

            // Add event listeners
            this.view.addEventListener(this.cid, highlight_views.EVENTS.SAVED, this.onSaved, this);
            this.view.addEventListener(this.cid, HighlightAppView.EVENTS.DESTROY_VIEW, this.onDestroyView, this);
        },

        onDomReady: function(notification) {
            $('#highlightapp').append(this.view.el);
        },

        onViewCreated: function(notification) {
            this.view.addView(notification.type, notification.view, notification.options);
        },

        onSaved: function(e, eventBody) {
            this.facade.trigger(notifications.VIEW_CREATE, {
                type: alert.mediators.AlertMediator.VIEW_TYPE,
                severity: alert.models.SEVERITY.SUCCESS,
                style: alert.models.STYLE.NORMAL,
                message: 'Save successful'
            });
        },

        onDestroyView: function(e, eventBody) {
            this.facade.trigger(notifications.VIEW_DESTROY, eventBody);
        }
    });

    /**
     * Init Models Command
     * @constructor
     * Registers the HighlightProxy, which in turn, registers
     * sub-proxies.
     */
    var InitModels = core.command.Command.extend({

        execute: function() {
            //Register Proxies
            //Register Proxies here if needed
        }
    });

    /**
     * Init Views Command
     * @constructor
     * Creates HighlightAppMediator main app view and sub-mediators
     * which in turn create additional views.
     */
    var InitViews = core.command.Command.extend({

        execute: function() {
            this.facade.registerMediator(new HighlightAppMediator(data));
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
     * Highlight App Facade
     * Concrete applicaion facade which facilitates communication
     * between disparate parts of the system through notifications.
     * 
     * This facade must be instantiated first.
     * (before any commands, mediators, or proxies).
     */
    var HighlightAppFacade = core.facade.Facade.extend({

        initialize: function() {
            //register facade instance
            core.facade.setInstance(this);
            
            //register commands
            this.registerCommand(notifications.APP_START, AppStartCommand);
        },

        /**
         * Start the application and connect highlight.
         */
        start: function() {
            this.trigger(notifications.APP_START);
        },
        
        /**
         * Stop the application.
         */
        stop: function() {
            this.trigger(notifications.APP_STOP);
        }
    });

    //one and only concrete facade
    var highlightAppFacade = new HighlightAppFacade();

    //start the app
    highlightAppFacade.start();

    //DOM ready notification
    $(document).ready(function() {
        highlightAppFacade.trigger(notifications.DOM_READY);
    });
});