define([
    'jQuery',
    'Underscore',
    'Backbone',
], function($, _, Backbone) {


    /**
     * Chat message header.
     * Header is common to all chat messages.
     */
    var MessageHeader = function(attributes) {
        this.id = null;
        this.type = null;
        this.chatSessionToken = null;
        this.userId = null;
        this.timestamp = null;
        _.extend(this, attributes);
    };

    _.extend(MessageHeader.prototype, {
        url: function() {
            return "/chat/message";
        }
    });

    /**
     * Chat Minute create message.
     */
    var MinuteCreateMessage = function(attributes) {
        this.minuteId = null;
        this.topicId = null;
        this.start = null;
        this.end = null;
        _.extend(this, attributes);
    };

    _.extend(MinuteCreateMessage.prototype, {
        type: "MINUTE_CREATE",

        url: function() {
            return "/minute";
        }
    });


    /**
     * Chat Tag create message.
     */
    var TagCreateMessage = function(attributes) {
        this.tagId = null;
        this.name = null;
        _.extend(this, attributes);
    };

    _.extend(TagCreateMessage.prototype, {
        type: "TAG_CREATE",

        url: function() {
            return "/tag";
        }
    });


    /**
     * Chat Tag delete message.
     */
    var TagDeleteMessage = function(attributes) {
        this.tagId = null;
        _.extend(this, attributes);
    };

    _.extend(TagDeleteMessage.prototype, {
        type: "TAG_DELETE",

        url: function() {
            return "/tag";
        }
    });


    /**
     * Chat Whiteboard create message.
     */
    var WhiteboardCreateMessage = function(attributes) {
        this.type = "WHITEBOARD_CREATE";
        this.whiteboardId = null;

        _.extend(this, attributes);
    };

    _.extend(WhiteboardCreateMessage.prototype, {
        type: "WHITEBOARD_CREATE",

        url: function() {
            return "/whiteboard";
        }
    });


    /**
     * Chat Whiteboard delete message.
     */
    var WhiteboardDeleteMessage = function(attributes) {
        this.type = "WHITEBOARD_DELETE";
        this.whiteboardId = null;

        _.extend(this, attributes);
    };

    _.extend(WhiteboardDeleteMessage.prototype, {
        type: "WHITEBOARD_DELETE",

        url: function() {
            return "/whiteboard";
        }
    });

   
    /**
     * Map message types to constructors
     */
    var messageTypeMap = {
        "MINUTE_CREATE": MinuteCreateMessage,
        "TAG_CREATE": TagCreateMessage,
        "TAG_DELETE": TagDeleteMessage,
        "WHITEBOARD_CREATE": WhiteboardCreateMessage,
        "WHITEBOARD_DELETE": WhiteboardDeleteMessage,
    };

    /**
     * Message factory for creating messages from
     * chat message header and msg.
     */
    var MessageFactory = function() {
        this.messageTypeMap = messageTypeMap;
    };

    MessageFactory.prototype.create = function(header, object) {
        var Constructor = this.messageTypeMap[header.type];
        if(Constructor) {
            return new Constructor(object);
        } else {
            return object;
        }
    };

    return {
        messageFactory: new MessageFactory(),
        MessageHeader: MessageHeader,
        MinuteCreateMessage: MinuteCreateMessage,
        TagCreateMessage: TagCreateMessage,
        TagDeleteMessage: TagDeleteMessage,
        WhiteboardCreateMessage: WhiteboardCreateMessage,
        WhiteboardDeleteMessage: WhiteboardDeleteMessage,
    };

});