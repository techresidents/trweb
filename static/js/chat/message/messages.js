define([
    'jQuery',
    'Underscore',
    'core/base',
], function($, _, base) {


    /**
     * Chat message header.
     * Header is common to all chat messages.
     */
    var MessageHeader = base.Base.extend({

        initialize: function(attributes) {
            this.id = null;
            this.type = null;
            this.chatSessionToken = null;
            this.userId = null;
            this.timestamp = null;
            _.extend(this, attributes);
        },

        url: function() {
            return "/chat/message";
        },

        timestamp_as_date: function() {
            if(this.timestamp) {
                var date = new Date();
                date.setTime(this.timestamp * 1000.0);
                return date;
            } else {
                return null;
            }
        }
    });

    
    /** Message base class.
     *
     */
    var MessageBase = base.Base.extend({

        initialize: function(attributes) {
            var defaults = base.getValue(this, 'defaults');

            _.extend(this, defaults);

            if(attributes) {
                for(var key in defaults) {
                    if(attributes.hasOwnProperty(key)) {
                        this[key] = attributes[key];
                    }
                }
            }

        },

        type: null,

        url: function() {},
    });


    /**
     * Marker create message.
     */
    var MarkerCreateMessage = MessageBase.extend({

        type: "MARKER_CREATE",

        defaults: {
            markerId: null,
            marker: null,
        },

        url: function() {
            return "/marker";
        }
    });


    /**
     * Chat Minute create message.
     */
    var MinuteCreateMessage = MessageBase.extend({

        type: "MINUTE_CREATE",

        defaults: {
            minuteId: null,
            topicId: null,
            startTimestamp: null,
            endTimestamp: null,
        },

        url: function() {
            return "/minute";
        }
    });


    /**
     * Chat Tag create message.
     */
    var TagCreateMessage = MessageBase.extend({

        type: "TAG_CREATE",

        defaults: {
            tagId: null,
            tagReferenceId: null,
            name: null,
            minuteId: null,
        },

        url: function() {
            return "/tag";
        }
    });


    /**
     * Chat Tag delete message.
     */
    var TagDeleteMessage = MessageBase.extend({

        type: "TAG_DELETE",
        
        defaults: {
            tagId: null,
        },

        url: function() {
            return "/tag";
        }
    });


    /**
     * Chat Whiteboard create message.
     */
    var WhiteboardCreateMessage = MessageBase.extend({

        type: "WHITEBOARD_CREATE",

        defaults: {
            whiteboardId: null,
            name: null,
        },

        url: function() {
            return "/whiteboard";
        }
    });


    /**
     * Chat Whiteboard delete message.
     */
    var WhiteboardDeleteMessage = MessageBase.extend({

        type: "WHITEBOARD_DELETE",
        
        defaults: {
            whiteboardId: null,
        },

        url: function() {
            return "/whiteboard";
        }
    });


    /**
     * Chat Whiteboard Path create message.
     */
    var WhiteboardCreatePathMessage = MessageBase.extend({

        type: "WHITEBOARD_CREATE_PATH",

        defaults: {
            whiteboardId: null,
            pathId: null,
            pathData: null,
        },

        url: function() {
            return "/whiteboard/" + this.whiteboardId + "/path";
        }
    });


    /**
     * Chat Whiteboard Path delete message.
     */
    var WhiteboardDeletePathMessage = MessageBase.extend({

        type: "WHITEBOARD_DELETE_PATH",

        defaults: {
            whiteboardId: null,
            pathId:  null,
        },

        url: function() {
            return "/whiteboard/" + this.whiteboardId + "/path";
        }
    });

   
    /**
     * Map message types to constructors
     */
    var messageTypeMap = {
        "MARKER_CREATE": MarkerCreateMessage,
        "MINUTE_CREATE": MinuteCreateMessage,
        "TAG_CREATE": TagCreateMessage,
        "TAG_DELETE": TagDeleteMessage,
        "WHITEBOARD_CREATE": WhiteboardCreateMessage,
        "WHITEBOARD_DELETE": WhiteboardDeleteMessage,
        "WHITEBOARD_CREATE_PATH": WhiteboardCreatePathMessage,
        "WHITEBOARD_DELETE_PATH": WhiteboardDeletePathMessage,
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
        MarkerCreateMessage: MarkerCreateMessage,
        MinuteCreateMessage: MinuteCreateMessage,
        TagCreateMessage: TagCreateMessage,
        TagDeleteMessage: TagDeleteMessage,
        WhiteboardCreateMessage: WhiteboardCreateMessage,
        WhiteboardDeleteMessage: WhiteboardDeleteMessage,
        WhiteboardCreatePathMessage: WhiteboardCreatePathMessage,
        WhiteboardDeletePathMessage: WhiteboardDeletePathMessage,
    };

});
