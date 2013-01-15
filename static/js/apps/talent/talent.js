define([
    'jquery',
    'underscore',
    'backbone',
    'common/notifications',
    'core/command',
    'core/facade',
    'core/mediator',
    'core/view',
    'talent/playback/mediators',
    'talent/player/mediators',
    'talent/player/models',
    'talent/player/proxies',
    'talent/search/mediators',
    'talent/user/mediators',
    'text!apps/talent/talent.html'
], function(
    $,
    _,
    Backbone,
    notifications,
    command,
    facade,
    mediator,
    view,
    playback_mediators,
    player_mediators,
    player_models,
    player_proxies,
    search_mediators,
    user_mediators,
    talent_app_template) {
    
    /**
     * Talent application router.
     */
    var TalentAppRouter = Backbone.Router.extend({
        routes: {
            'playback/:id': 'playback',
            'user/:id': 'user',                
            '*actions': 'search'

        },
        
        initialize: function(options) {
            this.facade = options.facade;

        },

        playback: function(id) {
            this.facade.trigger(notifications.VIEW_CREATE, {
                type: playback_mediators.PlaybackMediator.VIEW_TYPE,
                options: {
                    id: id
                }
            });
        },

        search: function() {
            this.facade.trigger(notifications.VIEW_CREATE, {
                type: search_mediators.SearchMediator.VIEW_TYPE,
                options: {}
            });
        },

        user: function(id) {
            this.facade.trigger(notifications.VIEW_CREATE, {
                type: user_mediators.UserMediator.VIEW_TYPE,
                options: {
                    id: id
                }
            });
        }
    });

    /**
     * Navigate Command
     */
    var NavigateCommand = command.Command.extend({

        execute: function(options) {
            router = this.facade.router;
            
            switch(options.type) {
                case "SearchView":
                    router.navigate("search", {trigger: true});
                    break;
            }
        }
    });
    
    /**
     * Talent application main view.
     * @constructor
     * @param {Object} options 
     */
    var TalentAppView = view.View.extend({
        

        initialize: function() {
            this.template = _.template(talent_app_template);
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
                case 'PlayerView':
                    this.$('#player-content').append(view.render().el);
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

        _destroyView: function(activeView) {
            this.triggerEvent(TalentAppView.EVENTS.DESTROY_VIEW, activeView);
        }

    }, {
        EVENTS: {
            DESTROY_VIEW: 'talent:destroyView'
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
            this.view = new TalentAppView(options);
            this.view.render();

            this.view.addEventListener(TalentAppView.EVENTS.DESTROY_VIEW, this.onDestroyView, this);

            //create and register sub-mediators
            this.facade.registerMediator(new player_mediators.PlayerMediator());
            this.facade.registerMediator(new playback_mediators.PlaybackMediator());
            this.facade.registerMediator(new search_mediators.SearchMediator());
            this.facade.registerMediator(new user_mediators.UserMediator());

            //create player view
            this.facade.trigger(notifications.VIEW_CREATE, {
                type: player_mediators.PlayerMediator.VIEW_TYPE
            });
            
        },

        onDomReady: function(notification) {
            $('#talentapp').append(this.view.el);
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
            this.facade.registerProxy(new player_proxies.PlayerStateProxy({
                model: new player_models.PlayerState()
            }));
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


            //register commands
            this.registerCommand(notifications.APP_START, AppStartCommand);
            this.registerCommand(notifications.VIEW_NAVIGATE, NavigateCommand);
        },

        initializeRouter: function() {
            //var pushState = !!(window.history && window.history.pushState);
            Backbone.history.start({
                pushState: true,
                root: '/talent/'
            });
            
            var that = this;

            $(document).on('click', 'a:not([data-bypass])', function(e) {
                var root = '/talent';
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
    var talentAppFacade = new TalentAppFacade();

    //start the app
    talentAppFacade.start();

    //DOM ready notification
    $(document).ready(function() {
        talentAppFacade.trigger(notifications.DOM_READY);
    });
});
