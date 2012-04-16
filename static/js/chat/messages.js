define([
    'jQuery',
    'Underscore',
    'Backbone',
], function($, _, Backbone) {


    var MessageHeader = function(attributes) {
        this.id = null;
        this.type = null;
        this.chatSessionToken = null;
        this.userId = null;
        this.timestamp = null;

        _.extend(this, attributes);
    };
    MessageHeader.prototype.url = function() {
        return "/chat/message";
    }


    var TagCreateMessage = function(attributes) {
        this.type = "TAG_CREATE";
        this.tagId = null;
        this.name = null;
            
        _.extend(this, attributes);
    };
    TagCreateMessage.prototype.url = function() {
        return "/tag";
    }
    

    var WhiteboardCreateMessage = function(attributes) {
        this.type = "WHITEBOARD_CREATE";
        this.whiteboardId = null;

        _.extend(this, attributes);
    };
    WhiteboardCreateMessage.prototype.url = function() {
        return "/whiteboard";
    }

    
    var messageTypeMap = {
        "TAG_CREATE": TagCreateMessage,
        "WHITEBOARD_CREATE": WhiteboardCreateMessage
    };

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
        TagCreateMessage: TagCreateMessage,
        WhiteboardCreateMessage: WhiteboardCreateMessage,
    }
});
