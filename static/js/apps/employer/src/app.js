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
    'player',
    'text!apps/employer/src/app.html'
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
    player,
    app_template) {
    
    /**
     * Application router.
     */
    var AppRouter = Backbone.Router.extend({
        routes: {
            'home': 'home',
            'application/:id': 'application',
            'playback/:id': 'playback',
            'tracker(/:query)': 'tracker',
            'user/:id': 'user',
            'search(/:query)': 'search',
            'requisition/create': 'createRequisition',
            'requisition/view/:id': 'readRequisition',
            'requisition/edit/:id': 'editRequisition',
            'requisition/list(/:query)': 'listRequisition',
            '*actions': 'search'
        },
        
        initialize: function(options) {
            this.facade = options.facade;

        },

        home: function() {
            require(['home'], _.bind(function(home) {
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: home.mediators.employer.EmployerHomeMediator.VIEW_TYPE,
                    options: {
                    }
                });
            }, this));
        },
        
        application: function(id) {
            require(['applicant'], _.bind(function(applicant) {
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: applicant.mediators.ApplicationMediator.VIEW_TYPE,
                    options: {
                        id: id
                    }
                });
            }, this));
        },

        playback: function(id) {
            require(['chat'], _.bind(function(chat) {
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: chat.mediators.playback.PlaybackMediator.VIEW_TYPE,
                    options: {
                        id: id
                    }
                });
            }, this));
        },

        search: function(query) {
            require(['search'], _.bind(function(search) {
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: search.mediators.SearchMediator.VIEW_TYPE,
                    options: {
                        query: query
                    }
                });
            }, this));
        },

        tracker: function(query) {
            require(['applicant'], _.bind(function(applicant) {
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: applicant.mediators.TrackerMediator.VIEW_TYPE,
                    options: {
                        query: query
                    }
                });
            }, this));
        },

        user: function(id) {
            require(['user'], _.bind(function(user) {
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: user.mediators.UserMediator.VIEW_TYPE,
                    options: {
                        id: id
                    }
                });
            }, this));
        },

        createRequisition: function() {
            require(['requisition'], _.bind(function(requisition) {
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: requisition.mediators.req.RequisitionMediator.VIEW_TYPE,
                    options: {
                        action: 'create'
                    }
                });
            }, this));
        },

        editRequisition: function(id) {
            require(['requisition'], _.bind(function(requisition) {
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: requisition.mediators.req.RequisitionMediator.VIEW_TYPE,
                    options: {
                        action: 'edit',
                        id: id
                    }
                });
            }, this));
        },

        readRequisition: function(id) {
            require(['requisition'], _.bind(function(requisition) {
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: requisition.mediators.req.RequisitionMediator.VIEW_TYPE,
                    options: {
                        action: 'read',
                        id: id
                    }
                });
            }, this));
        },

        listRequisition: function(query) {
            require(['requisition'], _.bind(function(requisition) {
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: requisition.mediators.list.RequisitionListMediator.VIEW_TYPE,
                    options: {
                        query: query
                    }
                });
            }, this));
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
            
            console.log(options);
            switch(options.type) {
                case 'SearchView':
                    uri = 'search';
                    if(options.query) {
                        uri += '/' + options.query;
                    }
                    router.navigate(uri, {trigger: options.trigger});
                    break;
                case 'TrackerView':
                    uri = 'tracker';
                    if(options.query) {
                        uri += '/' + options.query;
                    }
                    router.navigate(uri, {trigger: options.trigger});
                    break;
                case 'RequisitionView':
                    uri = 'requisition/';
                    if (options.action === "create") {
                        uri += 'create';
                        router.navigate(uri, { trigger: options.trigger});
                    }
                    else if (options.action === 'read') {
                        uri += 'view/' + options.id;
                        router.navigate(uri, { trigger: options.trigger});
                    }
                    else if (options.action === 'edit') {
                        uri += 'edit/' + options.id;
                        router.navigate(uri, { trigger: options.trigger});
                    }
                    break;
                case 'RequisitionListView':
                    uri = 'requisition/list';
                    if (options.query) {
                        uri += '/' + options.query;
                    }
                    router.navigate(uri, { trigger: options.trigger});
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
    /* APPLICATION EVENTS */
    EventNotificationMap[events.CREATE_APPLICATION] =
        notifications.CREATE_APPLICATION;
    EventNotificationMap[events.UPDATE_APPLICATION_STATUS] =
        notifications.UPDATE_APPLICATION_STATUS;
    EventNotificationMap[events.SCORE_APPLICANT] =
        notifications.SCORE_APPLICANT;
    EventNotificationMap[events.CAST_APPLICANT_VOTE] =
        notifications.CAST_APPLICANT_VOTE;
    /* APPLICATION LOG EVENTS */
    EventNotificationMap[events.CREATE_APPLICATION_LOG] =
        notifications.CREATE_APPLICATION_LOG;
    /* INTERVIEW OFFER EVENTS */
    EventNotificationMap[events.MAKE_INTERVIEW_OFFER] =
        notifications.MAKE_INTERVIEW_OFFER;
    EventNotificationMap[events.RESCIND_INTERVIEW_OFFER] =
        notifications.RESCIND_INTERVIEW_OFFER;
    EventNotificationMap[events.SHOW_MAKE_INTERVIEW_OFFER] =
        notifications.SHOW_MAKE_INTERVIEW_OFFER;
    EventNotificationMap[events.SHOW_RESCIND_INTERVIEW_OFFER] =
        notifications.SHOW_RESCIND_INTERVIEW_OFFER;
    /* DEVELOPER NOTE EVENTS */
    EventNotificationMap[events.TAKE_NOTE] =
        notifications.TAKE_NOTE;
    /* PLAYER EVENTS */
    EventNotificationMap[events.PLAYER_PLAY] =
        notifications.PLAYER_PLAY;
    EventNotificationMap[events.PLAYER_PAUSE] =
        notifications.PLAYER_PAUSE;

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

            //create player view
            this.facade.trigger(notifications.VIEW_CREATE, {
                type: player.mediators.PlayerMediator.VIEW_TYPE
            });
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
            this.facade.registerProxy(new ctrl.proxies.player.PlayerStateProxy({
                model: new player.models.PlayerState()
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
            this.root = 'e';

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

                if(href
                    && href.slice(0, protocol.length) !== protocol
                    && href.slice(0, root.length) === root) {
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
        appFacade.trigger(notifications.CHECK_BROWSER_COMPATIBILITY, {
            'chrome': 11,
            'firefox': 3.6,
            'msie': 9,
            'opera': 11,
            'safari': 5
        });
    });
});
