define([
    'jQuery',
    'Underscore',
    'Backbone',
    'chat/minute/models',
    'chat/tag/models',
    'chat/whiteboard/models',
], function($, _, Backbone, minute, tag, whiteboard) {


    /**
     * Chat message Dispatcher.
     * Dispatches chat messages to appropriate collections.
     * For example, tag related messages will be dispatched
     * to the tagCollection where views can monitor and
     * take action.
     *
     * This class helps to decouple the chat messages from
     * the resources (models) which they represent. For example,
     * the TAG_CREATE message, while containing tag data,
     * is not suitable as a general view model.
     */
    var Dispatcher = function(options) {
        this.chatMessages = options.chatMessages;

        this.initialize.call(this, options);
    };

    _.extend(Dispatcher.prototype, {

        initialize: function(options) {
            this.msgHandlerMap = {
                'MINUTE_CREATE': this.minuteCreate,
                'MINUTE_UPDATE': this.minuteUpdate,
                'TAG_CREATE': this.tagCreate,
                'TAG_DELETE': this.tagDelete,
                'WHITEBOARD_CREATE': this.whiteboardCreate,
                'WHITEBOARD_DELETE': this.whiteboardDelete,
            };

            this.chatMessages.bind('add', this.added, this);

        },

        added: function(model) {
            var handler = this.msgHandlerMap[model.msgType()];
            if(handler) {
                handler(model);
            }
        },

        minuteCreate: function(model) {
            var min = new minute.Minute(null, {
                header: model.header(),
                msg: model.msg()
            });
            minute.minuteCollection.add(min);
        },

        minuteUpdate: function(model) {
            var min = minute.minuteCollection.get(model.get('msg').minuteId);
            min.initialize(null, {
                header: model.header(),
                msg: model.msg()
            });
        },

        tagCreate: function(model) {
            var chatTag = new tag.Tag(null, {
                header: model.header(),
                msg: model.msg()
            });
            tag.tagCollection.add(chatTag);
        },

        tagDelete: function(model) {
            var chatTag = tag.tagCollection.get(model.get('msg').tagId);
            if(chatTag) {
                chatTag.trigger('destroy', chatTag);
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
            var wb = whiteboard.whiteboardCollection.get(model.get('msg').whiteboardId);
            if(wb) {
                wb.trigger('destroy', wb);
            }
        },

    });

    return {
        Dispatcher: Dispatcher,
    };
});
