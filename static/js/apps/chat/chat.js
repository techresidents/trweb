define([
    'jQuery',
    'Underscore',
    'Backbone',
    'chat/agenda/views',
    'chat/agenda/models',
    'chat/message/dispatch',
    'chat/message/models',
    'chat/session/models',
    'chat/tag/views',
    'chat/user/models',
    'chat/user/views',
    'chat/whiteboard/views',
    'topic/models',
], function(
    $,
    _,
    Backbone,
    agenda_views,
    agenda_models,
    dispatch,
    message,
    session,
    tag,
    user_models,
    user_views,
    whiteboard,
    topic) {

$(document).ready(function() {
    
    var ChatAppView = Backbone.View.extend({

            el: $("#chatapp"),

            initialize: function() {
                this.chatUsers = new user_models.ChatUserCollection();
                this.chatUsers.reset(this.options.data.users);
                this.chatUsers.bind("change", this.changed, this);
                
                //create chat session (not yet connected)
                this.chatSession = new session.ChatSession({
                        apiKey: this.options.data.chatAPIKey,
                        sessionToken: this.options.data.chatSessionToken,
                        userToken: this.options.data.chatUserToken,
                        users: this.chatUsers
                });

                //store current user
                user_models.currentUser = this.chatSession.getCurrentUser();

                //update chat agenda
                agenda_models.agenda.topics().reset(this.options.data.topics);

                //create a view for each user
                this.chatUsers.each(function(user) {
                    var chatUserView = new user_views.ChatUserView({
                            model: user,
                            id: user.id,
                            chatSession: this.chatSession,
                            css: 'span' + 12/this.chatUsers.length
                    });
                    this.$('#chat').append(chatUserView.render().el);
                }, this);
                
                //connect the chat session
                this.chatSession.connect();
                
                //chat message collection
                this.chatMessageCollection = new message.ChatMessageCollection(null, {
                        chatSessionToken: this.options.data.chatSessionToken,
                        userId: this.chatUsers.first().id
                });

                //dispatcher
                this.dispatcher = new dispatch.Dispatcher({
                        chatMessages: this.chatMessageCollection
                });
                
                //create tagger view
                var chatTaggerView = new tag.ChatTaggerView({
                        el: '#tagger',
                });
                chatTaggerView.render();

                /*
                //whiteboard view
                var whiteboardView = new whiteboard.ChatWhiteboardView({
                        el: $('#whiteboard'),
                        height: 350,
                        chatSessionToken: this.options.data.chatSessionToken,
                        userId: this.chatUsers.first().id,
                        chatMessageCollection: chatMessageCollection,
                });
                */


                //create tab views
                var chatAgendaTabView = new agenda_views.ChatAgendaTabView({
                    el: $('#agenda'),
                    chatSession: this.chatSession,
                    chatMessages: this.chatMessageCollection
                });
                chatAgendaTabView.render();

                var chatTagTabView = new tag.ChatTagTabView({
                    el: $('#tags'),
                    chatSession: this.chatSession,
                    chatMessages: this.chatMessageCollection
                });
                chatTagTabView.render();

                var chatWhiteboardTabView = new whiteboard.ChatWhiteboardTabView({
                    el: $('#whiteboard'),
                    chatSession: this.chatSession,
                    chatMessages: this.chatMessageCollection
                });


                //long poll
                this.chatMessageCollection.longPoll();
            },

            changed: function(user) {
            }
    });

    app = new ChatAppView({data: data});

});

    
});
