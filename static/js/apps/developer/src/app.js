define([
    'jquery',
    'jquery.bootstrap',
    'underscore',
    'backbone',
    'core',
    'api',
    'events',
    'notifications',
    'ctrl',
    'alert',
    'text!apps/developer/src/app.html'
], function(
    $,
    none,
    _,
    Backbone,
    core,
    api,
    events,
    notifications,
    ctrl,
    alert,
    app_template) {
    
    /**
     * Application router.
     */
    var AppRouter = Backbone.Router.extend({
        routes: {
            'chat/:id(/)': 'chat',
            'chatsim/:id(/)': 'chatSimulation',
            'home(/)': 'home',
            'profile/general(/)': 'profileGeneral',
            'profile/preferences(/)': 'profilePreferences',
            'profile/reel(/)': 'profileReel',
            'profile/skills(/)': 'profileSkills',
            'settings/account(/)': 'settingsAccount',
            'topic/:id(/)': 'topic',
            'topic/:id/talkingpoints(/)': 'topicTalkingPoints',
            'topics(/:query)(/)': 'topicSearch',
            '*actions': 'placeholder'
        },
        
        initialize: function(options) {
            this.facade = options.facade;

        },

        navigate: function(uri, options) {
            if(uri && uri[uri.length - 1] !== '/') {
                uri += '/';
            }
            AppRouter.__super__.navigate.call(this, uri, options);
        },

        chat: function(id) {
            require(['chat'], _.bind(function(chat) {
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: chat.mediators.chat.ChatMediator.VIEW_TYPE,
                    options: {
                        id: id
                    }
                });
            }, this));
        },

        chatSimulation: function(id) {
            require(['chat'], _.bind(function(chat) {
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: chat.mediators.chat.ChatMediator.VIEW_TYPE,
                    options: {
                        id: id,
                        simulation: true
                    }
                });
            }, this));
        },

        home: function() {
            require(['home'], _.bind(function(home) {
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: home.mediators.developer.DeveloperHomeMediator.VIEW_TYPE,
                    options: {
                    }
                });
            }, this));
        },

        profileGeneral: function() {
            require(['profile'], _.bind(function(profile) {
                var Mediator = profile.mediators.developer.DeveloperProfileMediator;
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: Mediator.VIEW_TYPE.GENERAL,
                    options: {
                    }
                });
            }, this));
        },

        profilePreferences: function() {
            require(['profile'], _.bind(function(profile) {
                var Mediator = profile.mediators.developer.DeveloperProfileMediator;
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: Mediator.VIEW_TYPE.PREFERENCES,
                    options: {
                    }
                });
            }, this));
        },

        profileSkills: function() {
            require(['profile'], _.bind(function(profile) {
                var Mediator = profile.mediators.developer.DeveloperProfileMediator;
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: Mediator.VIEW_TYPE.SKILLS,
                    options: {
                    }
                });
            }, this));
        },

        profileReel: function() {
            require(['chat'], _.bind(function(chat) {
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: chat.mediators.reel.ChatReelMediator.VIEW_TYPE,
                    options: {
                    }
                });
            }, this));
        },

        settingsAccount: function() {
            require(['settings'], _.bind(function(settings) {
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: settings.mediators.developer.DeveloperSettingsMediator.VIEW_TYPE,
                    options: {
                    }
                });
            }, this));
        },

        topic: function(id) {
            require(['chat'], _.bind(function(chat) {
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: chat.mediators.topic.TopicMediator.VIEW_TYPE,
                    options: {
                        id: id
                    }
                });
            }, this));
        },

        topicSearch: function(query) {
            require(['chat'], _.bind(function(chat) {
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: chat.mediators.topicsearch.TopicSearchMediator.VIEW_TYPE,
                    options: {
                        query: query
                    }
                });
            }, this));
        },

        topicTalkingPoints: function(id) {
            require(['chat'], _.bind(function(chat) {
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: chat.mediators.tlkpt.TalkingPointsMediator.VIEW_TYPE,
                    options: {
                        id: id
                    }
                });
            }, this));
        },

        placeholder: function() {
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

            switch (options.type) {
                case 'ChatView':
                    uri = 'chat/' + options.id;
                    router.navigate(uri, {trigger: options.trigger});
                    break;
                case 'DeveloperHomeView':
                    uri = 'home';
                    router.navigate(uri, {trigger: options.trigger});
                    break;
                case 'TalkingPointView':
                    uri = 'topic/' + options.id + '/talkingpoints';
                    router.navigate(uri, {trigger: options.trigger});
                    break;
                case 'TopicSearchView':
                    uri = 'topics';
                    if(options.query) {
                        uri += '/' + options.query;
                    }
                    router.navigate(uri, {trigger: options.trigger});
                    break;
            }
        }
    });
    
    /**
     * Application main view.
     * @constructor
     * @param {Object} options 
     */
    var AppView = core.view.View.extend({
        

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
            }
        },

        _destroyView: function(activeView) {
            this.triggerEvent(AppView.EVENTS.DESTROY_VIEW, activeView);
        }

    }, {
        EVENTS: {
            DESTROY_VIEW: 'app:destroyView'
        }
    });
   
    /**
     * Event to Notification map
     */
    var EventNotificationMap = {};
    /* VIEW EVENTS */
    EventNotificationMap[events.VIEW_NAVIGATE] =
        notifications.VIEW_NAVIGATE;
    /* ALERT EVENTS */
    EventNotificationMap[events.ALERT] =
        notifications.ALERT;
    /* CHAT EVENTS */
    EventNotificationMap[events.PARTICIPATE_IN_CHAT] =
        notifications.PARTICIPATE_IN_CHAT;
    EventNotificationMap[events.UPDATE_CHAT_STATUS] =
        notifications.UPDATE_CHAT_STATUS;
    EventNotificationMap[events.UPDATE_CHAT_USER_STATUS] =
        notifications.UPDATE_CHAT_USER_STATUS;
    EventNotificationMap[events.ADD_CHAT_TO_REEL] =
        notifications.ADD_CHAT_TO_REEL;
    EventNotificationMap[events.CREATE_CHAT] =
        notifications.CREATE_CHAT;
    EventNotificationMap[events.UPDATE_TALKING_POINTS] =
        notifications.UPDATE_TALKING_POINTS;
    EventNotificationMap[events.UPDATE_CHAT_REEL] =
        notifications.UPDATE_CHAT_REEL;
    /* PROFILE EVENTS */
    EventNotificationMap[events.UPDATE_USER] =
        notifications.UPDATE_USER;
    EventNotificationMap[events.UPDATE_SKILLS] =
        notifications.UPDATE_SKILLS;
    EventNotificationMap[events.UPDATE_DEVELOPER_ACCOUNT] =
        notifications.UPDATE_DEVELOPER_ACCOUNT;
    EventNotificationMap[events.UPDATE_DEVELOPER_PREFERENCES] =
        notifications.UPDATE_DEVELOPER_PREFERENCES;

    /**
     * App Mediator
     * @constructor
     * @param {Object} options
     */
    var AppMediator = core.mediator.Mediator.extend({
        name: 'AppMediator',
        
        /**
         * Notification handlers
         */
        notifications: [
            [notifications.DOM_READY, 'onDomReady'],
            [notifications.VIEW_CREATED, 'onViewCreated']
        ],

        initialize: function(options) {
            this.view = new AppView(options);
            this.view.render();

            this.view.addEventListener(this.cid, AppView.EVENTS.DESTROY_VIEW, this.onDestroyView, this);
            _.each(EventNotificationMap, function(notificationName, eventName) {
                this.view.addEventListener(this.cid, eventName, this.onNotificationEvent, this);
            }, this);
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
            this.facade.registerProxy(new ctrl.proxies.current.CurrentProxy({
                user: TR.CURRENT_USER
            }));
        }
    });

    /**
     * Init Views Command
     * @constructor
     * Creates AppMediator main app view and sub-mediators
     * which in turn create additional views.
     */
    var InitViews = core.command.Command.extend({

        execute: function() {
            this.facade.registerMediator(new AppMediator());
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
     * App Facade
     * Concrete applicaion facade which facilitates communication
     * between disparate parts of the system through notifications.
     * 
     * This facade must be instantiated first.
     * (before any commands, mediators, or proxies).
     */
    var AppFacade = core.facade.Facade.extend({

        initialize: function() {
            //app root
            this.root = 'd';

            //register facade instance
            core.facade.setInstance(this);
            
            //create router
            this.router = new AppRouter({
                facade: this
            });


            //register commands
            this.registerCommand(notifications.APP_START, AppStartCommand);
            this.registerCommand(notifications.VIEW_NAVIGATE, NavigateCommand);

            /* APPLICATION COMMANDS */
            this.registerCommand(notifications.CREATE_APPLICATION,
                ctrl.commands.applicant.CreateApplication);
            this.registerCommand(notifications.UPDATE_APPLICATION_STATUS,
                ctrl.commands.applicant.UpdateApplicationStatus);
            this.registerCommand(notifications.SCORE_APPLICANT,
                ctrl.commands.applicant.ScoreApplicant);
            this.registerCommand(notifications.CAST_APPLICANT_VOTE,
                ctrl.commands.applicant.CastApplicantVote);
            /* APPLICATION LOG COMMANDS */
            this.registerCommand(notifications.CREATE_APPLICATION_LOG,
                ctrl.commands.applicant.CreateApplicationLog);
            /* CHAT COMMANDS */
            this.registerCommand(notifications.CREATE_CHAT,
                ctrl.commands.chat.CreateChat);
            this.registerCommand(notifications.PARTICIPATE_IN_CHAT,
                ctrl.commands.chat.ParticipateInChat);
            this.registerCommand(notifications.UPDATE_CHAT_STATUS,
                ctrl.commands.chat.UpdateChatStatus);
            this.registerCommand(notifications.UPDATE_CHAT_USER_STATUS,
                ctrl.commands.chat.UpdateChatUserStatus);
            this.registerCommand(notifications.UPDATE_TALKING_POINTS,
                ctrl.commands.chat.UpdateTalkingPoints);
            this.registerCommand(notifications.UPDATE_CHAT_REEL,
                ctrl.commands.chat.UpdateChatReel);
            this.registerCommand(notifications.ADD_CHAT_TO_REEL,
                ctrl.commands.chat.AddChatToReel);
            /* INTERVIEW OFFER COMMANDS */
            this.registerCommand(notifications.MAKE_INTERVIEW_OFFER,
                ctrl.commands.applicant.MakeInterviewOffer);
            this.registerCommand(notifications.RESCIND_INTERVIEW_OFFER,
                ctrl.commands.applicant.RescindInterviewOffer);
            this.registerCommand(notifications.SHOW_MAKE_INTERVIEW_OFFER,
                ctrl.commands.applicant.ShowMakeInterviewOffer);
            this.registerCommand(notifications.SHOW_RESCIND_INTERVIEW_OFFER,
                ctrl.commands.applicant.ShowRescindInterviewOffer);
            /* DEVELOPER NOTE COMMANDS */
            this.registerCommand(notifications.TAKE_NOTE,
                ctrl.commands.user.TakeNote);
            /* BROWSER COMPATIBILITY COMMANDS */
            this.registerCommand(notifications.CHECK_BROWSER_COMPATIBILITY,
                ctrl.commands.browser.CheckBrowserCompatibility);
            this.registerCommand(notifications.CHECK_FLASH_COMPATIBILITY,
                ctrl.commands.browser.CheckFlashCompatibility);
            /* PROFILE COMMANDS */
            this.registerCommand(notifications.UPDATE_USER,
                ctrl.commands.profile.UpdateUser);
            this.registerCommand(notifications.UPDATE_SKILLS,
                ctrl.commands.profile.UpdateSkills);
            this.registerCommand(notifications.UPDATE_LOCATION_PREFS,
                ctrl.commands.profile.UpdateLocationPrefs);
            this.registerCommand(notifications.UPDATE_POSITION_PREFS,
                ctrl.commands.profile.UpdatePositionPrefs);
            this.registerCommand(notifications.UPDATE_TECHNOLOGY_PREFS,
                ctrl.commands.profile.UpdateTechnologyPrefs);
            this.registerCommand(notifications.UPDATE_DEVELOPER_PROFILE,
                ctrl.commands.profile.UpdateDeveloperProfile);
            this.registerCommand(notifications.UPDATE_DEVELOPER_ACCOUNT,
                ctrl.commands.profile.UpdateDeveloperAccount);
            this.registerCommand(notifications.UPDATE_DEVELOPER_PREFERENCES,
                ctrl.commands.profile.UpdateDeveloperPreferences);
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
                root: '/' + this.root + '/'
            });
            
            var that = this;

            $(document).on('click', 'a:not([data-bypass])', function(e) {
                var root = '/' + that.root;
                var href = $(this).attr('href');
                var protocol = this.protocol + '//';
                
                if(href &&
                   href.slice(0, protocol.length) !== protocol &&
                   href.slice(0, root.length) === root) {
                        e.preventDefault();
                        that.router.navigate(href.slice(root.length, href.length), true);
                }
            });
        },
        
        /**
         * Start the application.
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
    var appFacade = new AppFacade();

    //start the app
    appFacade.start();

    //DOM ready notification
    $(document).ready(function() {
        appFacade.initializeRouter();
        appFacade.trigger(notifications.DOM_READY);
        appFacade.trigger(notifications.CHECK_FLASH_COMPATIBILITY, {
            majorVersion: 10,
            minorVersion: 1
        });
        // Browser warning (via an alert) trumps flash version warning
        appFacade.trigger(notifications.CHECK_BROWSER_COMPATIBILITY, {
            'chrome': 11,
            'firefox': 3.6,
            'msie': 9,
            'opera': 11,
            'safari': 5
        });
    });
});
