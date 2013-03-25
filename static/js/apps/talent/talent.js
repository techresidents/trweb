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
    'talent/player/mediators',
    'talent/player/models',
    'talent/player/proxies',
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
    current_proxies,
    player_mediators,
    player_models,
    player_proxies,
    talent_app_template) {
    
    /**
     * Talent application router.
     */
    var TalentAppRouter = Backbone.Router.extend({
        routes: {
            'playback/:id': 'playback',
            'tracker(/:query)': 'tracker',
            'user/:id': 'user',                
            '*actions': 'search'

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

        playback: function(id) {
            require(['talent/playback/mediators'], _.bind(function(mediators) {
                this.ensureMediator(mediators.PlaybackMediator);
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: mediators.PlaybackMediator.VIEW_TYPE,
                    options: {
                        id: id
                    }
                });
            }, this));
        },

        tracker: function(query) {
            require(['talent/tracker/mediators'], _.bind(function(mediators) {
                this.ensureMediator(mediators.TrackerMediator);
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: mediators.TrackerMediator.VIEW_TYPE,
                    options: {
                        query: query
                    }
                });
            }, this));
        },

        search: function() {
            require(['talent/search/mediators'], _.bind(function(mediators) {
                this.ensureMediator(mediators.SearchMediator);
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: mediators.SearchMediator.VIEW_TYPE,
                    options: {}
                });
            }, this));
        },

        user: function(id) {
            require(['talent/user/mediators'], _.bind(function(mediators) {
                this.ensureMediator(mediators.UserMediator);
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: mediators.UserMediator.VIEW_TYPE,
                    options: {
                        id: id
                    }
                });
            }, this));
        }
    });

    /**
     * Navigate Command
     */
    var NavigateCommand = command.Command.extend({
        execute: function(options) {
            var uri;
            options = _.extend({
                trigger: true
            }, options);
            router = this.facade.router;
            
            switch(options.type) {
                case 'SearchView':
                    uri = 'search';
                    router.navigate(uri, {trigger: options.trigger});
                    break;
                case 'TrackerView':
                    uri = 'tracker';
                    if(options.query) {
                        uri += '/' + options.query;
                    }
                    router.navigate(uri, {trigger: options.trigger});
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
                    this.$('#content').html(view.render().el);
                    $('html,body').scrollTop(0);
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

            this.view.addEventListener(this.cid, TalentAppView.EVENTS.DESTROY_VIEW, this.onDestroyView, this);

            //create and register sub-mediators
            this.facade.registerMediator(new player_mediators.PlayerMediator());

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
     * Registers Proxies.
     */
    var InitModels = command.Command.extend({

        execute: function() {
            this.facade.registerProxy(new current_proxies.CurrentProxy({
                user: TR.CURRENT_USER
            }));
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
            this.facade.registerMediator(new TalentAppMediator());
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
            this.trigger(notifications.APP_START, TR.data);
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
        talentAppFacade.initializeRouter();
        talentAppFacade.trigger(notifications.DOM_READY);
    });
});
