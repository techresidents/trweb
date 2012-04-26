define([
    'jQuery',
    'Underscore',
    'Backbone',
    'chat/agenda/models',
    'chat/message/dispatch',
    'chat/message/models',
    'chat/session/models',
    'chat/tag/models',
    'chat/user/models',
    'chat/whiteboard/models',
], function(
    $,
    _,
    Backbone,
    agenda,
    dispatch,
    message,
    session_models,
    tag,
    user,
    whiteboard) {
    
    var Chat = Backbone.Model.extend({
        localStorage: new Backbone.LocalStorage('Chat'),
        
        defaults: function() {
            return {
                agenda: null,
                currentUser: null,
                dispatcher: null,
                messages: null,
                session: null,
                users: null,
                tags: null,
                whiteboards: null,
            };
        },
        
        initialize: function(attributes, options) {
            this.chatAPIKey = options.chatAPIKey;
            this.chatSessionToken = options.chatSessionToken;
            this.chatUserToken = options.chatUserToken;
            
            //set users
            user.users.reset(options.users);

            //create chat session (not yet connected)
            var session = new session_models.ChatSession({
                    apiKey: this.chatAPIKey,
                    sessionToken: this.chatSessionToken,
                    userToken: this.chatUserToken,
                    users: user.users
            });

            //set current user
            user.currentUser = session.getCurrentUser();

            //create chat message collection
            var messages = new message.ChatMessageCollection(null, {
                    chatSessionToken: this.chatSessionToken,
                    userId: user.users.first().id
            });

            //create chat message dispatcher
            var dispatcher = new dispatch.Dispatcher({
                    chatMessages: messages
            });

            //update chat agenda topics
            agenda.agenda.topics().reset(options.topics);

            this.set({
                session: session,
                messages: messages,
                dispatcher: dispatcher,
                users: user.users,
                currentUser: user.currentUser,
                agenda: agenda.agenda,
                tags: tag.tagCollection,
                whiteboards: whiteboard.whiteboardCollection
            });

        },

        connect: function() {
            this.get('session').connect();
        },

        agenda: function() {
            return this.get('agenda');
        },

        currentUser: function() {
            return this.get('currentUser');
        },

        dispatcher: function() {
            return this.get('dispatcher');
        },

        messages: function() {
            return this.get('messages');
        },

        session: function() {
            return this.get('session');
        },

        users: function() {
            return this.get('users');
        },

        tags: function() {
            return this.get('tags');
        },

        whiteboards: function() {
            return this.get('whiteboards');
        },
    });

    return {
        Chat: Chat,
        chat: null,
    };
});
