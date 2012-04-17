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

            initialize: function() {
                this.model = this.options.model;
                console.log(this.model);
                console.log(this.model.id);
                console.log(this.model.toJSON());
            },
            
            render: function() {
                $(this.el).html(this.template(this.model.toJSON()));
                return this;
            }
    });

    
    var ChatTagView = Backbone.View.extend({

            el: $("#tags"),

            events: {
                "click button": "addTag",
                //"keypress #taginput": "updateOnEnter"
                "keypress input": "updateOnEnter"
            },

            initialize: function() {
                this.chatSessionToken = this.options.chatSessionToken;
                this.userId = this.options.userId;
                this.chatMessageCollection = this.options.chatMessageCollection;
                this.chatMessageCollection.bind("reset", this.reset, this);
                this.chatMessageCollection.bind("add", this.added, this);

                this.taglist = this.$("#taglist");
                this.tagInput = this.$("#taginput");
                
                this.lookupView = new lookup.LookupView({
                    el: this.tagInput,
                    scope: "tag",
                    forceSelection: false,
                    onselect: function(value, object) { console.log("onsel"); console.log(value); console.log(object); },
                    onenter: function(value, object) { console.log("onent"); console.log(value); console.log(object); }
                });
            },
            
            reset: function() {
            },

            added: function(model) {
                if(model.msgType() != "TAG_CREATE") {
                    return;
                }

                this.taglist.append(new ChatTagItemView({model: model}).render().el);

                //scroll to bottom
                this.taglist.animate({scrollTop: 1000}, 800);
            },

            addTag: function() {
                var value = this.tagInput.val();

                if(value) {
                    var header = new messages.MessageHeader({
                        chatSessionToken: this.chatSessionToken,
                        userId: this.userId
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
                    this.taglist.animate({scrollTop: 1000}, 800);

                } else {
                    this.tagInput.focus();
                }
            },

            updateOnEnter: function(e) {
                if(e.keyCode == 13) {
                    this.addTag();
                }
            }
    });


    var ChatTagTabView = Backbone.View.extend({

            initialize: function() {
            },
    });


    return {
        ChatTagTabView: ChatTagTabView,
        ChatTagView: ChatTagView,
        ChatTagItemView: ChatTagItemView,
    }
});
