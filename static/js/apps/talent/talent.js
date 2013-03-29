define([
    'jquery',
    'underscore',
    'backbone',
    'alert/mediators',
    'common/notifications',
    'core/command',
    'core/facade',
    'core/mediator',
    'core/view',
    'current/proxies',
    'talent/events',
    'talent/notifications',
    'talent/applicant/commands',
    'talent/player/mediators',
    'talent/player/models',
    'talent/player/proxies',
    'text!apps/talent/talent.html'
], function(
    $,
    _,
    Backbone,
    alert_mediators,
    notifications,
    command,
    facade,
    mediator,
    view,
    current_proxies,
    talent_events,
    talent_notifications,
    applicant_commands,
    player_mediators,
    player_models,
    player_proxies,
    talent_app_template) {
    
    /**
     * Talent application router.
     */
    var TalentAppRouter = Backbone.Router.extend({
        routes: {
            'application/:id': 'application',
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

        application: function(id) {
            require(['talent/applicant/mediators'], _.bind(function(mediators) {
                this.ensureMediator(mediators.ApplicationMediator);
                this.ensureMediator(mediators.OfferMediator);
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: mediators.ApplicationMediator.VIEW_TYPE,
                    options: {
                        id: id
                    }
                });
            }, this));
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

        search: function() {
            require(['talent/search/mediators'], _.bind(function(mediators) {
                this.ensureMediator(mediators.SearchMediator);
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: mediators.SearchMediator.VIEW_TYPE,
                    options: {}
                });
            }, this));
        },

        tracker: function(query) {
            require(['talent/applicant/mediators'], _.bind(function(mediators) {
                this.ensureMediator(mediators.TrackerMediator);
                this.ensureMediator(mediators.OfferMediator);
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: mediators.TrackerMediator.VIEW_TYPE,
                    options: {
                        query: query
                    }
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
            if(view.isModal()) {
                this.append(view);
            } else if(view.isAlert()) {
                this.html(view, '#alerts');
            } else {
                switch(type) {
                    case 'PlayerView':
                        this.append(view, '#player-content');
                        break;
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
            this.triggerEvent(TalentAppView.EVENTS.DESTROY_VIEW, activeView);
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
    /* APPLICATION EVENTS*/
    EventNotificationMap[talent_events.CREATE_APPLICATION] =
        talent_notifications.CREATE_APPLICATION;
    EventNotificationMap[talent_events.UPDATE_APPLICATION_STATUS] =
        talent_notifications.UPDATE_APPLICATION_STATUS;
    EventNotificationMap[talent_events.SCORE_APPLICANT] =
        talent_notifications.SCORE_APPLICANT;
    EventNotificationMap[talent_events.CAST_APPLICANT_VOTE] =
        talent_notifications.CAST_APPLICANT_VOTE;
    /* APPLICATION LOG EVENTS*/
    EventNotificationMap[talent_events.CREATE_APPLICATION_LOG] =
        talent_notifications.CREATE_APPLICATION_LOG;
    /* INTERVIEW OFFER EVENTS*/
    EventNotificationMap[talent_events.MAKE_INTERVIEW_OFFER] =
        talent_notifications.MAKE_INTERVIEW_OFFER;
    EventNotificationMap[talent_events.RESCIND_INTERVIEW_OFFER] =
        talent_notifications.RESCIND_INTERVIEW_OFFER;
    EventNotificationMap[talent_events.SHOW_MAKE_INTERVIEW_OFFER] =
        talent_notifications.SHOW_MAKE_INTERVIEW_OFFER;
    EventNotificationMap[talent_events.SHOW_RESCIND_INTERVIEW_OFFER] =
        talent_notifications.SHOW_RESCIND_INTERVIEW_OFFER;

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
            _.each(EventNotificationMap, function(notificationName, eventName) {
                this.view.addEventListener(this.cid, eventName, this.onNotificationEvent, this);
            }, this);

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
        },

        onNotificationEvent: function(e, eventBody) {
            console.log(e.type);
            var notification = EventNotificationMap[e.type];
            console.log(notification);
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
            this.facade.registerMediator(new alert_mediators.AlertMediator());
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
            
            /* APPLICATION COMMANDS */
            this.registerCommand(talent_notifications.CREATE_APPLICATION,
                applicant_commands.CreateApplication);
            this.registerCommand(talent_notifications.UPDATE_APPLICATION_STATUS,
                applicant_commands.UpdateApplicationStatus);
            this.registerCommand(talent_notifications.SCORE_APPLICANT,
                applicant_commands.ScoreApplicant);
            this.registerCommand(talent_notifications.CAST_APPLICANT_VOTE,
                applicant_commands.CastApplicantVote);
            /* APPLICATION LOG COMMANDS */
            this.registerCommand(talent_notifications.CREATE_APPLICATION_LOG,
                applicant_commands.CreateApplicationLog);
            /* INTERVIEW OFFER COMMANDS */
            this.registerCommand(talent_notifications.MAKE_INTERVIEW_OFFER,
                applicant_commands.MakeInterviewOffer);
            this.registerCommand(talent_notifications.RESCIND_INTERVIEW_OFFER,
                applicant_commands.RescindInterviewOffer);
            this.registerCommand(talent_notifications.SHOW_MAKE_INTERVIEW_OFFER,
                applicant_commands.ShowMakeInterviewOffer);
            this.registerCommand(talent_notifications.SHOW_RESCIND_INTERVIEW_OFFER,
                applicant_commands.ShowRescindInterviewOffer);
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
