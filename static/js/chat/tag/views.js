define([
    'jQuery',
    'Underscore',
    'Backbone',
    'chat/models',
    'chat/messages',
    'lookup/views',
], function($, _, Backbone, models, messages, lookup) {


    var ChatTagItemView = Backbone.View.extend({
            tagName: "li",

            template: _.template($("#tag-item-template").html()),
            
            render: function() {
                this.$el.html(this.template(this.model.toJSON()));
                this.$('[rel=tooltip]').tooltip();
                return this;
            }
    });

    
    var ChatTagView = Backbone.View.extend({

            events: {
                "click button": "addTag",
            },

            initialize: function() {
                this.chatSession = this.options.chatSession;
                this.chatMessages = this.options.chatMessages;
                this.chatUser = this.chatSession.getCurrentUser();

                this.chatMessages.bind("add", this.added, this);
                
                this.tagInput = this.$("input");
                this.tagList = this.$("ul");
                
                this.lookupView = new lookup.LookupView({
                    el: this.tagInput,
                    scope: "tag",
                    forceSelection: false,
                    onenter: this.updateOnEnter,
                    context: this
                });
            },
            
            added: function(model) {
                if(model.msgType() != "TAG_CREATE") {
                    return;
                }

                this.tagList.append(new ChatTagItemView({model: model}).render().el);
            },

            addTag: function() {
                var value = this.tagInput.val();

                if(value) {
                    var header = new messages.MessageHeader({
                        chatSessionToken: this.chatSessionToken,
                        userId: this.chatUser.id
                    });

                    var msg = new messages.TagCreateMessage({
                        name: this.tagInput.val()
                    });

                    var message = new models.ChatMessage({
                            header: header,
                            msg: msg
                    });

                    message.save();

                    this.tagInput.val("");
                    this.tagInput.focus();

                    //scroll to bottom
                    this.tagList.animate({scrollTop: 1000}, 800);

                } else {
                    this.tagInput.focus();
                }
            },

            updateOnEnter: function(value) {
                this.addTag();
            }
    });


    var ChatTagTabView = Backbone.View.extend({

            initialize: function() {
                this.chatSession = this.options.chatSession;
                this.chatMessages = this.options.chatMessages;
                this.chatUser = this.chatSession.getCurrentUser();

                this.chatMessages.bind("reset", this.reset, this);
                this.chatMessages.bind("add", this.added, this);
                
                this.tagList = this.$("ul");
            },
            
            reset: function() {
            },

            added: function(model) {
                if(model.msgType() != "TAG_CREATE") {
                    return;
                }

                this.tagList.append(new ChatTagItemView({model: model}).render().el);

                //scroll to bottom
                this.tagList.animate({scrollTop: 1000}, 800);
            },
    });


    return {
        ChatTagTabView: ChatTagTabView,
        ChatTagView: ChatTagView,
        ChatTagItemView: ChatTagItemView,
    }
});
