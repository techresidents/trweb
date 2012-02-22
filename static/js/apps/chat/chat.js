define([
    'jQuery',
    'Underscore',
    'Backbone',
    'chat/models',
    'chat/views'
], function($, _, Backbone, models, views) {

$(document).ready(function() {
    
    var ChatAppView = Backbone.View.extend({

            el: $("#chatapp"),

            initialize: function() {
                this.chatUsers = new models.ChatUserCollection();
                this.chatUsers.reset(this.options.data.users);
                this.chatUsers.bind("change", this.changed, this);
                
                //create chat session (not yet connected)
                this.chatSession = new models.ChatSession({
                        apiKey: this.options.data.chatAPIKey,
                        sessionToken: this.options.data.chatSessionToken,
                        userToken: this.options.data.chatUserToken,
                        users: this.chatUsers
                });
                
                //create a view for each user
                this.chatUsers.each(function(user) {
                    var chatUserView = new views.ChatUserView({
                            model: user,
                            id: user.id,
                            chatSession: this.chatSession,
                            css: "span" + 12/this.chatUsers.length
                    });
                    this.$("#chat").append(chatUserView.render().el);
                }, this);
                
                //connect the chat session
                this.chatSession.connect();


                var chatMessageCollection = new models.ChatMessageCollection(null, {
                        chatSessionToken: this.options.data.chatSessionToken,
                        userId: this.chatUsers.first().id
                });

                //create tag view
                var chatTagView = new views.ChatTagView({
                        chatSessionToken: this.options.data.chatSessionToken,
                        userId: this.chatUsers.first().id,
                        chatMessageCollection: chatMessageCollection});
                
                //whiteboard view
                var whiteboardView = new views.ChatWhiteboardView({
                        el: $("#whiteboard"),
                        height: 350,
                        chatSessionToken: this.options.data.chatSessionToken,
                        userId: this.chatUsers.first().id,
                        chatMessageCollection: chatMessageCollection,
                });

                //long poll
                chatMessageCollection.longPoll();
            },

            changed: function(user) {
            }
    });

    app = new ChatAppView({data: data});

});

    
});
