define([
    'jQuery',
    'Underscore',
    'Backbone',
    'common/notifications',
    'core/command',
    'core/facade',
    'core/mediator',
    'api/models',
    'text!apps/talent/talent.html'
], function(
    $,
    _,
    Backbone,
    notifications,
    command,
    facade,
    mediator,
    api,
    talent_app_template) {

    /**
     * Talent application router.
     */
    var TalentAppRouter = Backbone.Router.extend({
        routes: {
            "search": "search",
            "*actions": "search"
        },
        
        initialize: function(options) {
            this.facade = options.facade;
        },

        search: function() {
            console.log("search");
            this.facade.trigger(notifications.VIEW_CREATE, {
                type: "SearchView"
            });
        }
    });

    /**
     * Navigate Command
     */
    var NavigateCommand = command.Command.extend({

        execute: function(options) {
            router = this.facade.router;

            if(options.type === "SearchView") {
                router.navigate("search", {trigger: true});
            }
        }
    });
    
    /**
     * Talent application main view.
     * @constructor
     * @param {Object} options 
     */
    var TalentAppView = Backbone.View.extend({

        initialize: function() {
            this.template = _.template(talent_app_template);
        },

        render: function() {
            this.$el.html(this.template());
            return this;
        },

        addView: function(type, view) {
        }

    });
   

    /**
     * Talent App Mediator
     * @constructor
     * @param {Object} options
     */
    var TalentAppMediator = mediator.Mediator.extend({
        name: 'TalentAppMediator',
        
        /**
         * Notification handlers
         */
        notifications: [
            [notifications.DOM_READY, 'onDomReady'],
            [notifications.VIEW_CREATED, 'onViewCreated']
        ],

        initialize: function(options) {
            console.log("INIT");
            this.view = new TalentAppView(options);
            this.view.render();

            //create and register sub-mediators
            //TODO
        },

        onDomReady: function(notification) {
            console.log("DOM READY");
            $('#talentapp').append(this.view.el);
        },

        onViewCreated: function(notification) {
            this.view.addView(notification.type, notification.view);
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
            //this.facade.registerProxy(new talent_proxies.TalentProxy(data));
        }
    });

    /**
     * Init Views Command
     * @constructor
     * Creates TalentAppMediator main app view and sub-mediators
     * which in turn create additional views.
     */
    var InitViews = command.Command.extend({

        execute: function() {
            this.facade.registerMediator(new TalentAppMediator(data));
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
     * Talent App Facade
     * Concrete applicaion facade which facilitates communication
     * between disparate parts of the system through notifications.
     * 
     * This facade must be instantiated first.
     * (before any commands, mediators, or proxies).
     */
    var TalentAppFacade = facade.Facade.extend({

        initialize: function() {
            //register facade instance
            facade.setInstance(this);
            
            //create router
            this.router = new TalentAppRouter({
                facade: this
            });

            Backbone.history.start({
                pushState: true,
                root: "/talent/"
            });

            //register commands
            this.registerCommand(notifications.APP_START, AppStartCommand);
            this.registerCommand(notifications.VIEW_NAVIGATE, NavigateCommand);
        },
        
        /**
         * Start the application and connect talent.
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
    var talentAppFacade = new TalentAppFacade();

    //start the app
    talentAppFacade.start();

    var chat = new api.Chat({
        'id': 'zik0zk'
    });
    chat.fetch({
        success: function() {console.log(chat);}
    });
    /*
    var topic = new api.Topic({
        'id': 26
    });
    topic.fetch({
        success: function() {console.log(topic);}
    });
    console.log(topic);
    */
    
    //DOM ready notification
    $(document).ready(function() {
        talentAppFacade.trigger(notifications.DOM_READY);
    });
});
