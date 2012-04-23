define([
    'jQuery',
    'Underscore',
    'Backbone',
    'chat/tag/models',
    'chat/whiteboard/models',
], function($, _, Backbone, tag, whiteboard) {


    var Dispatcher = function(options) {
        this.chatMessages = options.chatMessages;

        this.initialize.call(this, options);
    };

    _.extend(Dispatcher.prototype, {

        initialize: function(options) {
            this.msgHandlerMap = {
                "TAG_CREATE": this.tagCreate,
                "TAG_DELETE": this.tagDelete,
                "WHITEBOARD_CREATE": this.whiteboardCreate,
                "WHITEBOARD_DELETE": this.whiteboardDelete,
            };

            this.chatMessages.bind("add", this.added, this);

        },

        added: function(model) {
            var handler = this.msgHandlerMap[model.msgType()];
            if(handler) {
                handler(model);
            }
        },

        tagCreate: function(model) {
            var chatTag = new tag.Tag(null, {
                header: model.header(),
                msg: model.msg()
            });
            tag.tagCollection.add(chatTag);
        },

        tagDelete: function(model) {
            var chatTag = tag.tagCollection.get(model.get("msg").tagId);
            if(chatTag) {
                chatTag.trigger("destroy", chatTag);
            }
        },

        whiteboardCreate: function(model) {
            var wb = new whiteboard(null, {
                header: model.header(),
                msg: model.msg()
            });
            whiteboard.whiteboardCollection.add(wb);
        },

        whiteboardDelete: function(model) {
            var wb = whiteboard.whiteboardCollection.get(model.get("msg").whiteboardId);
            if(wb) {
                wb.trigger("destroy", wb);
            }
        },

    });

    return {
        Dispatcher: Dispatcher,
    };
});
