define([
    'jquery',
    'underscore',
    'backbone',
    'common/notifications',
    'core/command',
    'core/facade',
    'core/mediator',
    'core/view',
    'api/models',
    'api/session',
    'apps/highlight/views',
    'text!apps/highlight/templates/highlight.html'
], function(
    $,
    _,
    Backbone,
    notifications,
    command,
    facade,
    mediator,
    view,
    api,
    api_session,
    highlight_views,
    highlight_app_template) {
    
    /**
     * Highlight application main view.
     * @constructor
     * @param {Object} options 
     *   model: User model (required)
     */
    var HighlightAppView = view.View.extend({
        
        initialize: function(options) {
            this.template = _.template(highlight_app_template);
            this.model = options.model;
            this.model.bind('loaded', this.loaded, this);

            if(!this.model.isLoading()) {
                this.load();
            }
        },

        load: function() {
            var state = this.model.isLoadedWith("chat_sessions__chat__topic", "highlight_sessions");
            
            if(!state.loaded) {
                state.fetcher();
            }
        },

        loaded: function() {
            //Cover case where model was already loading at time of view
            //creation, but not all necessary data was loaded. Invoking
            //load again will ensure all necessary data is loaded. If
            //all data is already loaded, this is a no-op.
            this.load();
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
            }).render();

            return this;
        }
    });
   
    /**
     * Highlight App Mediator
     * @constructor
     * @param {Object} options
     */
    var HighlightAppMediator = mediator.Mediator.extend({
        name: 'HighlightAppMediator',
        
        /**
         * Notification handlers
         */
        notifications: [
            [notifications.DOM_READY, 'onDomReady']
        ],

        initialize: function(options) {
            this.session = new api_session.ApiSession.get('global');
            this.userModel = this.session.getModel(api.User, options.userId);
            /*
            this.userModel = new api.User({
                id: options.userId
            });
            */

            this.view = new HighlightAppView({
                model: this.userModel
            });
            this.view.render();

            //create and register sub-mediators
            //Register sub-mediators here if needed
        },

        onDomReady: function(notification) {
            $('#highlightapp').append(this.view.el);
        }
    });

    /**
     * Init Models Command
     * @constructor
     * Registers the HighlightProxy, which in turn, registers
     * sub-proxies.
     */
    var InitModels = command.Command.extend({

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
    var InitViews = command.Command.extend({

        execute: function() {
            this.facade.registerMediator(new HighlightAppMediator(data));
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
     * Highlight App Facade
     * Concrete applicaion facade which facilitates communication
     * between disparate parts of the system through notifications.
     * 
     * This facade must be instantiated first.
     * (before any commands, mediators, or proxies).
     */
    var HighlightAppFacade = facade.Facade.extend({

        initialize: function() {
            //register facade instance
            facade.setInstance(this);
            
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
