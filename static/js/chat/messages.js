define([
    'jQuery',
    'Underscore',
    'Backbone',
], function($, _, Backbone) {



    var ChatMessageHeader = function(attributes) {
        this.id = null;
        this.type = null;
        this.chatSessionToken = null;
        this.userId = null;
        this.timestamp = null;

        _.extend(this, attributes);
    };


    var ChatTagMessage = function(attributes) {
        this.type = "tag";
        this.name = null;

        _.extend(this, attributes);
    };


    var ChatWhiteboardMessage = function(attributes) {
        this.type = "whiteboard";
        this.command = null;
        this.data = {}

        _.extend(this, attributes);
    };

    
    var messageTypeMap = {
        "tag": ChatTagMessage,
        "whiteboard": ChatWhiteboardMessage
    };

    var ChatMessageFactory = function() {
        this.messageTypeMap = messageTypeMap;
    };

    ChatMessageFactory.prototype.create = function(header, object) {
        var Constructor = this.messageTypeMap[header.type];
        if(Constructor) {
            return new Constructor(object);
        } else {
            return object;
        }
    };


    return {
        chatMessageFactory: new ChatMessageFactory(),
        ChatMessageHeader: ChatMessageHeader,
        ChatTagMessage: ChatTagMessage,
        ChatWhiteboardMessage: ChatWhiteboardMessage,
    }
});
