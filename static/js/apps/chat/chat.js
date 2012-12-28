define([
    'jquery',
    'underscore',
    'backbone',
    'alert/mediators',
    'common/notifications',
    'core/command',
    'core/facade',
    'core/mediator',
    'chat/agenda/mediators',
    'chat/commands',
    'chat/proxies',
    'chat/feedback/commands',
    'chat/marker/commands',
    'chat/marker/mediators',
    'chat/message/commands',
    'chat/minute/commands',
    'chat/discuss/mediators',
    'chat/tag/commands',
    'chat/tag/mediators',
    'chat/user/mediators',
    'text!apps/chat/chat.html'
], function(
    $,
    _,
    Backbone,
    alert_mediators,
    notifications,
    command,
    facade,
    mediator,
    agenda_mediators,
    chat_commands,
    chat_proxies,
    feedback_commands,
    marker_commands,
    marker_mediators,
    message_commands,
    minute_commands,
    discuss_mediators,
    tag_commands,
    tag_mediators,
    user_mediators,
    chat_app_template) {
    
    /**
     * Chat application main view.
     * @constructor
     * @param {Object} options 
     */
    var ChatAppView = Backbone.View.extend({

        initialize: function() {
            this.template = _.template(chat_app_template);
        },

        render: function() {
            this.$el.html(this.template());
            return this;
        },

        addView: function(type, view) {
            switch(type) {
                case 'AlertView':
                    this.$('#alerts').append(view.render().el);
                    break;
                case 'ChatUserView':
                    this.$('#chat').append(view.render().el);
                    break;
                case 'DiscussView':
                    this.$('#discuss').append(view.render().el);
                    break;
                case 'AgendaTabView':
                    this.$('#agenda').html(view.render().el);
                    break;
            }
        },
        
        showAgenda: function() {
            this.$('a[href="#agenda"]').tab('show');
        }
    });
   

    /**
     * Chat App Mediator
     * @constructor
     * @param {Object} options
     */
    var ChatAppMediator = mediator.Mediator.extend({
        name: 'ChatAppMediator',
        
        /**
         * Notification handlers
         */
        notifications: [
            [notifications.DOM_READY, 'onDomReady'],
            [notifications.VIEW_CREATED, 'onViewCreated'],
            [notifications.SHOW_AGENDA, 'onShowAgenda']
        ],

        initialize: function(options) {
            this.view = new ChatAppView(options);
            this.view.render();

            //create and register sub-mediators
            this.facade.registerMediator(new alert_mediators.AlertMediator());
            this.facade.registerMediator(new marker_mediators.ChatMarkersMediator());
            this.facade.registerMediator(new user_mediators.ChatUsersMediator());
            this.facade.registerMediator(new discuss_mediators.DiscussMediator());
            this.facade.registerMediator(new tag_mediators.TaggerMediator());
            this.facade.registerMediator(new agenda_mediators.AgendaTabMediator());
        },

        onDomReady: function(notification) {
            $('#chatapp').append(this.view.el);
        },

        onViewCreated: function(notification) {
            this.view.addView(notification.type, notification.view);
        },

        onShowAgenda: function(notification) {
            this.view.showAgenda();
        },

        onShowResources: function(notification) {
            this.view.showResources();
        },

        onShowWhiteboards: function(notification) {
            this.view.showWhiteboards();
        }

    });

    /**
     * Init Models Command
     * @constructor
     * Registers the ChatProxy, which in turn, registers
     * sub-proxies.
     */
    var InitModels = command.Command.extend({

        execute: function() {
            this.facade.registerProxy(new chat_proxies.ChatProxy(data));
        }
    });

    /**
     * Init Views Command
     * @constructor
     * Creates ChatAppMediator main app view and sub-mediators
     * which in turn create additional views.
     */
    var InitViews = command.Command.extend({

        execute: function() {
            this.facade.registerMediator(new ChatAppMediator(data));
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
     * Chat App Facade
     * Concrete applicaion facade which facilitates communication
     * between disparate parts of the system through notifications.
     * 
     * This facade must be instantiated first.
     * (before any commands, mediators, or proxies).
     */
    var ChatAppFacade = facade.Facade.extend({

        initialize: function() {
            //register facade instance
            facade.setInstance(this);

            //register commands
            this.registerCommand(notifications.APP_START, AppStartCommand);
            this.registerCommand(notifications.CHAT_CONNECT, chat_commands.ChatConnectCommand);
            this.registerCommand(notifications.CHAT_START, chat_commands.ChatStartCommand);
            this.registerCommand(notifications.CHAT_END, chat_commands.ChatEndCommand);
            this.registerCommand(notifications.CHAT_ENDED, chat_commands.ChatEndedCommand);
            this.registerCommand(notifications.CHAT_NEXT_TOPIC, chat_commands.ChatNextTopicCommand);
            this.registerCommand(notifications.MARKER_CREATE, marker_commands.CreateMarkerCommand);
            this.registerCommand(notifications.MARKER_CONNECTED_CREATE, marker_commands.CreateConnectedMarkerCommand);
            this.registerCommand(notifications.MARKER_JOINED_CREATE, marker_commands.CreateJoinedMarkerCommand);
            this.registerCommand(notifications.MARKER_PUBLISHING_CREATE, marker_commands.CreatePublishingMarkerCommand);
            this.registerCommand(notifications.MARKER_SPEAKING_CREATE, marker_commands.CreateSpeakingMarkerCommand);
            this.registerCommand(notifications.MARKER_STARTED_CREATE, marker_commands.CreateStartedMarkerCommand);
            this.registerCommand(notifications.MARKER_ENDED_CREATE, marker_commands.CreateEndedMarkerCommand);
            this.registerCommand(notifications.MARKER_RECORDING_STARTED_CREATE, marker_commands.CreateRecordingStartedMarkerCommand);
            this.registerCommand(notifications.MARKER_RECORDING_ENDED_CREATE, marker_commands.CreateRecordingEndedMarkerCommand);
            this.registerCommand(notifications.MARKER_SKEW_CREATE, marker_commands.CreateSkewMarkerCommand);
            this.registerCommand(notifications.MESSAGE_MARKER_CREATE, message_commands.MarkerCreateMessageCommand);
            this.registerCommand(notifications.MESSAGE_MINUTE_CREATE, message_commands.MinuteCreateMessageCommand);
            this.registerCommand(notifications.MESSAGE_MINUTE_UPDATE, message_commands.MinuteUpdateMessageCommand);
            this.registerCommand(notifications.MESSAGE_TAG_CREATE, message_commands.TagCreateMessageCommand);
            this.registerCommand(notifications.MESSAGE_TAG_DELETE, message_commands.TagDeleteMessageCommand);
            this.registerCommand(notifications.MESSAGE_WHITEBOARD_CREATE, message_commands.WhiteboardCreateMessageCommand);
            this.registerCommand(notifications.MESSAGE_WHITEBOARD_DELETE, message_commands.WhiteboardDeleteMessageCommand);
            this.registerCommand(notifications.MESSAGE_WHITEBOARD_CREATE_PATH, message_commands.WhiteboardCreatePathMessageCommand);
            this.registerCommand(notifications.MESSAGE_WHITEBOARD_DELETE_PATH, message_commands.WhiteboardDeletePathMessageCommand);
            this.registerCommand(notifications.MINUTE_START, minute_commands.StartMinuteCommand);
            this.registerCommand(notifications.MINUTE_END, minute_commands.EndMinuteCommand);
            this.registerCommand(notifications.SHOW_FEEDBACK, feedback_commands.ShowFeedbackCommand);
            this.registerCommand(notifications.TAG_CREATE, tag_commands.CreateTagCommand);
            this.registerCommand(notifications.TAG_DELETE, tag_commands.DeleteTagCommand);
        },
        
        /**
         * Start the application and connect chat.
         */
        start: function() {
            this.trigger(notifications.APP_START);
            this.trigger(notifications.CHAT_CONNECT);
        },
        
        /**
         * Stop the application.
         */
        stop: function() {
            this.trigger(notifications.APP_STOP);
        }
    });
    
    //one and only concrete facade
    var chatAppFacade = new ChatAppFacade();

    //start the app
    chatAppFacade.start();
    
    //DOM ready notification
    $(document).ready(function() {
        chatAppFacade.trigger(notifications.DOM_READY);
    });

});
