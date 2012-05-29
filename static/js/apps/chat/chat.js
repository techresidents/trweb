define([
    'jQuery',
    'Underscore',
    'Backbone',
    'common/notifications',
    'core/command',
    'core/facade',
    'core/mediator',
    'chat/agenda/mediators',
    'chat/commands',
    'chat/proxies',
    'chat/message/commands',
    'chat/discuss/mediators',
    'chat/resource/mediators',
    'chat/tag/commands',
    'chat/tag/mediators',
    'chat/user/mediators',
    'chat/whiteboard/commands',
    'chat/whiteboard/mediators',
], function(
    $,
    _,
    Backbone,
    notifications,
    command,
    facade,
    mediator,
    agenda_mediators,
    chat_commands,
    proxies,
    message_commands,
    discuss_mediators,
    resource_mediators,
    tag_commands,
    tag_mediators,
    user_mediators,
    whiteboard_commands,
    whiteboard_mediators) {

$(document).ready(function() {

    
    /**
     * Chat application main view.
     * @constructor
     * @param {options} 
     *   chatAPIKey: Tokbox API Key (required) 
     *   chatSessionToken: Tokbox session token (required)
     *   chatUserToken: Tokbox user token (required)
     *   users: users participating in chat (required)
     *   topics: chat topics (required)
     */
    var ChatAppView = Backbone.View.extend({

        el: $('#chatapp'),

        initialize: function() {
        },

        addView: function(type, view) {
            switch(type) {
                case 'ChatUserView':
                    this.$('#chat').append(view.render().el);
                    break;
                case 'DiscussView':
                    this.$('#discuss').html(view.render().el);
                    break;
                case 'ChatTaggerView':
                    this.$('#tagger').html(view.render().el);
                    break;
                case 'AgendaTabView':
                    this.$('#agenda').html(view.render().el);
                    break;
                case 'WhiteboardTabView':
                    this.$('#whiteboard').html(view.render().el);
                    break;
                case 'ResourcesTabView':
                    this.$('#resources').html(view.render().el);
                    break;
            }
        },

    });
   

    var ChatAppMediator = mediator.Mediator.extend({
        name: 'ChatAppMediator',
        
        notifications: [
            [notifications.VIEW_CREATED, 'onViewCreated'],
        ],

        initialize: function(options) {
            this.view = new ChatAppView(options);

            //sub-mediators
            this.facade.registerMediator(new user_mediators.ChatUsersMediator());
            this.facade.registerMediator(new discuss_mediators.DiscussMediator());
            this.facade.registerMediator(new tag_mediators.TaggerMediator());
            this.facade.registerMediator(new agenda_mediators.AgendaTabMediator());
            this.facade.registerMediator(new whiteboard_mediators.WhiteboardTabMediator());
            this.facade.registerMediator(new resource_mediators.ResourcesTabMediator());
        },

        onViewCreated: function(type, view) {
            this.view.addView(type, view);
        },

    });

    var InitModels = command.Command.extend({

        execute: function() {
            this.facade.registerProxy(new proxies.ChatProxy(data));
        }
    });

    var InitViews = command.Command.extend({

        execute: function() {
            this.facade.registerMediator(new ChatAppMediator(data));
        }
    });

    var StartUpCommand = command.MacroCommand.extend({

        initialize: function() {
            console.log('execute startup');
            this.addSubCommand(InitModels);
            this.addSubCommand(InitViews);
        },
    });

    var StartChatCommand = command.Command.extend({

        execute: function() {
            console.log('execute start chat');
            var chatProxy = this.facade.getProxy(proxies.ChatProxy.NAME);
            console.log('start');
            chatProxy.start();
        }
    });


    var ChatAppFacade = facade.Facade.extend({

        initialize: function() {
            facade.setInstance(this);
            this.registerCommand('StartUp', StartUpCommand);
            this.registerCommand('StartChat', StartChatCommand);
            this.registerCommand(notifications.CHAT_NEXT_TOPIC, chat_commands.ChatNextTopicCommand);
            this.registerCommand(notifications.MESSAGE_MINUTE_CREATE, message_commands.MinuteCreateMessageCommand);
            this.registerCommand(notifications.MESSAGE_MINUTE_UPDATE, message_commands.MinuteUpdateMessageCommand);
            this.registerCommand(notifications.MESSAGE_TAG_CREATE, message_commands.TagCreateMessageCommand);
            this.registerCommand(notifications.MESSAGE_TAG_DELETE, message_commands.TagDeleteMessageCommand);
            this.registerCommand(notifications.MESSAGE_WHITEBOARD_CREATE, message_commands.WhiteboardCreateMessageCommand);
            this.registerCommand(notifications.MESSAGE_WHITEBOARD_DELETE, message_commands.WhiteboardDeleteMessageCommand);
            this.registerCommand(notifications.MESSAGE_WHITEBOARD_CREATE_PATH, message_commands.WhiteboardCreatePathMessageCommand);
            this.registerCommand(notifications.MESSAGE_WHITEBOARD_DELETE_PATH, message_commands.WhiteboardDeletePathMessageCommand);
            this.registerCommand(notifications.TAG_CREATE, tag_commands.CreateTagCommand);
            this.registerCommand(notifications.TAG_DELETE, tag_commands.DeleteTagCommand);
            this.registerCommand(notifications.WHITEBOARD_CREATE, whiteboard_commands.CreateWhiteboardCommand);
            this.registerCommand(notifications.WHITEBOARD_DELETE, whiteboard_commands.DeleteWhiteboardCommand);
            this.registerCommand(notifications.WHITEBOARD_PATH_CREATE, whiteboard_commands.CreateWhiteboardPathCommand);
            this.registerCommand(notifications.WHITEBOARD_PATH_DELETE, whiteboard_commands.DeleteWhiteboardPathCommand);
        },

        startUp: function() {
            this.trigger('StartUp');
            this.trigger('StartChat');
        },

        shutdown: function() {
            this.trigger('Shutdown');
        }
    });

    var chatAppFacade = new ChatAppFacade();
    chatAppFacade.startUp();
});

    
});
