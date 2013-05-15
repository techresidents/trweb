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
            'chat/:id': 'chat',
            'topic/:id': 'topic',
            '*actions': 'placeholder'
        },
        
        initialize: function(options) {
            this.facade = options.facade;

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
            
            switch(options.type) {
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
    /* APPLICATION EVENTS*/
    EventNotificationMap[events.CREATE_APPLICATION] =
        notifications.CREATE_APPLICATION;
    EventNotificationMap[events.UPDATE_APPLICATION_STATUS] =
        notifications.UPDATE_APPLICATION_STATUS;
    EventNotificationMap[events.SCORE_APPLICANT] =
        notifications.SCORE_APPLICANT;
    EventNotificationMap[events.CAST_APPLICANT_VOTE] =
        notifications.CAST_APPLICANT_VOTE;
    /* APPLICATION LOG EVENTS*/
    EventNotificationMap[events.CREATE_APPLICATION_LOG] =
        notifications.CREATE_APPLICATION_LOG;
    /* INTERVIEW OFFER EVENTS*/
    EventNotificationMap[events.MAKE_INTERVIEW_OFFER] =
        notifications.MAKE_INTERVIEW_OFFER;
    EventNotificationMap[events.RESCIND_INTERVIEW_OFFER] =
        notifications.RESCIND_INTERVIEW_OFFER;
    EventNotificationMap[events.SHOW_MAKE_INTERVIEW_OFFER] =
        notifications.SHOW_MAKE_INTERVIEW_OFFER;
    EventNotificationMap[events.SHOW_RESCIND_INTERVIEW_OFFER] =
        notifications.SHOW_RESCIND_INTERVIEW_OFFER;
    /* DEVELOPER NOTE EVENTS*/
    EventNotificationMap[events.TAKE_NOTE] =
        notifications.TAKE_NOTE;

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
    });
});
