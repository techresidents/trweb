define([
    'jQuery',
    'Underscore',
    'Backbone',
    'chat/models',
    'chat/agenda/views',
    'chat/discuss/views',
    'chat/tag/views',
    'chat/user/views',
    'chat/whiteboard/views',
], function(
    $,
    _,
    Backbone,
    models,
    agenda,
    discuss,
    tag,
    user,
    whiteboard) {

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
            this.chat = new models.Chat(null, {
                chatAPIKey: this.options.chatAPIKey,
                chatSessionToken: this.options.chatSessionToken,
                chatUserToken: this.options.chatUserToken,
                users: this.options.users,
                topics: this.options.topics,
            });
            
            //set chat model
            models.chat = this.chat;
            

            //create a view for each user
            this.chat.users().each(function(chatUser) {
                var chatUserView = new user.ChatUserView({
                        model: chatUser,
                        id: chatUser.id,
                        chatSession: this.chat.session(),
                        css: 'span' + 12/this.chat.users().length
                });
                this.$('#chat').append(chatUserView.render().el);
            }, this);

            //create discuss view
            var discussView = new discuss.DiscussView({
                el: '#discuss'
            });
            discussView.render();

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
            var chatAgendaTabView = new agenda.ChatAgendaTabView({
                el: $('#agenda'),
            });
            chatAgendaTabView.render();


            var chatWhiteboardTabView = new whiteboard.ChatWhiteboardTabView({
                el: $('#whiteboard'),
            });
            
            //connect the chat and start polling for messages.
            this.chat.connect();
            this.chat.messages().longPoll();
        },
    });
    
    //constuct main app view
    app = new ChatAppView(data);
});

    
});
