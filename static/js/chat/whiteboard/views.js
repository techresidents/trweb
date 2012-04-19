define([
    'jQuery',
    'Underscore',
    'Backbone',
    'whiteboard/views',
    'whiteboard/serialize',
], function($, _, Backbone, whiteboard, serialize) {


    var ChatWhiteboardView = whiteboard.WhiteboardView.extend({

            initialize: function() {
                whiteboard.WhiteboardView.prototype.initialize.call(this);

                this.chatSessionToken = this.options.chatSessionToken;
                this.userId = this.options.userId;
                this.chatMessageCollection = this.options.chatMessageCollection;
                this.chatMessageCollection.bind("reset", this.reset, this);
                this.chatMessageCollection.bind("add", this.added, this);
                
                this.serializer = new serialize.Serializer();
            },

            reset: function() {
            },

            added: function(model) {
                if(model.msgType() != "whiteboard") {
                    return;
                }
                
                var msg = model.get("msg");
                this.paper.add(this.serializer.deserializeElement(msg.data));
            },

            onElementAdded: function(tool, element) {
                whiteboard.WhiteboardView.prototype.onElementAdded.call(this, tool, element);

                /*

                var header = new messages.MessageHeader({
                        chatSessionToken: this.chatSessionToken,
                        userId: this.userId
                });

                var msg = new messages.WhiteboardCreateMessage({
                        data: this.serializer.serializeElement(element)
                });


                var message = new models.ChatMessage({
                        header: header,
                        msg: msg
                });

                message.save();
                //element.remove();
                */
            }
    });


    var ChatWhiteboardTabView = Backbone.View.extend({

            initialize: function() {
            },
    });


    return {
        ChatWhiteboardTabView: ChatWhiteboardTabView,
        ChatWhiteboardView: ChatWhiteboardView,
    }
});
