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
            'application/:id(/)': 'application',
            'company(/)': 'companyProfile',
            'company/edit(/)': 'editCompanyProfile',
            'home(/)': 'home',
            'offers(/:query)(/)': 'offers',
            'playback/:id(/)': 'playback',
            'requisition/create(/)': 'createRequisition',
            'requisition/view/:id(/)': 'readRequisition',
            'requisition/edit/:id(/)': 'editRequisition',
            'requisition/list(/:query)(/)': 'listRequisition',
            'search(/:query)(/)': 'search',
            'settings/account(/)': 'settingsAccount',
            'tracker(/:query)(/)': 'tracker',
            'user/:id(/)': 'user',
            '*actions': 'search'
        },
        
        initialize: function(options) {
            this.facade = options.facade;
        },

        navigate: function(uri, options) {
            if(uri && uri[uri.length - 1] !== '/') {
                uri += '/';
            }
            this.facade.trigger(notifications.TRACK_PAGE_VIEW, {
                uri: '/' + uri
            });
            AppRouter.__super__.navigate.call(this, uri, options);
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
                var Mediator = user.mediators.employer.user.EmployerUserMediator;
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: Mediator.VIEW_TYPE,
                    options: {
                        id: id
                    }
                });
            }, this));
        },

        createRequisition: function() {
            require(['requisition'], _.bind(function(requisition) {
                var Mediator = requisition.mediators.req.RequisitionMediator;
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: Mediator.VIEW_TYPE.CREATE,
                    options: {}
                });
            }, this));
        },

        editRequisition: function(id) {
            require(['requisition'], _.bind(function(requisition) {
                var Mediator = requisition.mediators.req.RequisitionMediator;
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: Mediator.VIEW_TYPE.EDIT,
                    options: {id: id}
                });
            }, this));
        },

        readRequisition: function(id) {
            require(['requisition'], _.bind(function(requisition) {
                var Mediator = requisition.mediators.req.RequisitionMediator;
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: Mediator.VIEW_TYPE.READ,
                    options: {id: id}
                });
            }, this));
        },

        listRequisition: function(query) {
            require(['requisition'], _.bind(function(requisition) {
                var Mediator = requisition.mediators.list.RequisitionListMediator;
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: Mediator.VIEW_TYPE,
                    options: {
                        query: query
                    }
                });
            }, this));
        },

        settingsAccount: function() {
            require(['settings'], _.bind(function(settings) {
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: settings.mediators.employer.EmployerSettingsMediator.VIEW_TYPE,
                    options: {
                    }
                });
            }, this));
        },

        offers: function(query) {
            require(['offer'], _.bind(function(offer) {
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: offer.mediators.employer.EmployerOffersMediator.VIEW_TYPE,
                    options: {
                        query: query
                    }
                });
            }, this));
        },

        companyProfile: function() {
            require(['company'], _.bind(function(company) {
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: company.mediators.employer.CompanyProfileMediator.VIEW_TYPE.READ,
                    options: {
                    }
                });
            }, this));
        },

        editCompanyProfile: function() {
            require(['company'], _.bind(function(company) {
                this.facade.trigger(notifications.VIEW_CREATE, {
                    type: company.mediators.employer.CompanyProfileMediator.VIEW_TYPE.EDIT,
                    options: {
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
                case 'EmployerOffersView':
                    uri = 'offers';
                    if(options.query) {
                        uri += '/' + options.query;
                    }
                    router.navigate(uri, {trigger: options.trigger});
                    break;
                case 'ApplicationView':
                    uri = 'application/' + options.id;
                    router.navigate(uri, {trigger: options.trigger});
                    break;
                case 'RequisitionReadView':
                    uri = 'requisition/view/' + options.id;
                    router.navigate(uri, { trigger: options.trigger});
                    break;
                case 'RequisitionEditView':
                    uri = 'requisition/edit/' + options.id;
                    router.navigate(uri, { trigger: options.trigger});
                    break;
                case 'RequisitionCreateView':
                    uri = 'requisition/create';
                    router.navigate(uri, { trigger: options.trigger});
                    break;
                case 'RequisitionListView':
                    uri = 'requisition/list';
                    if (options.query) {
                        uri += '/' + options.query;
                    }
                    router.navigate(uri, { trigger: options.trigger});
                    break;
                case 'EmployerCompanyProfileView':
                    uri = 'company';
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
    /* DEVELOPER NOTE EVENTS */
    EventNotificationMap[events.TAKE_NOTE] =
        notifications.TAKE_NOTE;
    /* PLAYER EVENTS */
    EventNotificationMap[events.PLAYER_PLAY] =
        notifications.PLAYER_PLAY;
    EventNotificationMap[events.PLAYER_PAUSE] =
        notifications.PLAYER_PAUSE;
    /* REQUISITION EVENTS */
    EventNotificationMap[events.SAVE_REQUISITION] =
        notifications.SAVE_REQUISITION;
    /* PROFILE EVENTS */
    EventNotificationMap[events.UPDATE_USER] =
        notifications.UPDATE_USER;
    /* COMPANY PROFILE EVENTS */
    EventNotificationMap[events.UPDATE_COMPANY_PROFILE] =
        notifications.UPDATE_COMPANY_PROFILE;

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

            /* TRACK COMMANDS */
            this.registerCommand(notifications.TRACK_PAGE_VIEW,
                ctrl.commands.track.TrackPageView);
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
            /* DEVELOPER NOTE COMMANDS */
            this.registerCommand(notifications.TAKE_NOTE,
                ctrl.commands.user.TakeNote);
            /* BROWSER COMPATIBILITY COMMANDS */
            this.registerCommand(notifications.CHECK_BROWSER_COMPATIBILITY,
                ctrl.commands.browser.CheckBrowserCompatibility);
            this.registerCommand(notifications.CHECK_FLASH_COMPATIBILITY,
                ctrl.commands.browser.CheckFlashCompatibility);
            /* REQUISITION COMMANDS */
            this.registerCommand(notifications.UPDATE_REQUISITION,
                ctrl.commands.requisition.UpdateRequisition);
            this.registerCommand(notifications.UPDATE_REQUISITION_TECHNOLOGIES,
                ctrl.commands.requisition.UpdateRequisitionTechnologies);
            this.registerCommand(notifications.SAVE_REQUISITION,
                ctrl.commands.requisition.SaveRequisition);
            /* PROFILE COMMANDS */
            this.registerCommand(notifications.UPDATE_USER,
                ctrl.commands.profile.UpdateUser);
            /* COMPANY PROFILE COMMANDS */
            this.registerCommand(notifications.UPDATE_COMPANY_PROFILE,
                ctrl.commands.company.UpdateCompanyProfile);
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
        appFacade.trigger(notifications.CHECK_BROWSER_COMPATIBILITY, {
            'chrome': 11,
            'firefox': 3.6,
            'msie': 9,
            'opera': 11,
            'safari': 5
        });
    });
});
