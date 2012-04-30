define([
    'jQuery',
    'Underscore',
    'Backbone',
    'xd/xd',
    'xd/backbone',
    'chat/message/messages',
], function($, _, Backbone, xd, xdBackbone, messages) {
    
    /**
     * Represent chat messages from server.
     * @constructor
     * @param {Object} attributes model attributes (optional)
     * @param {Object} options
     *   header: chat message header (optional)
     *   msg: chat message body (optional)
     */
    var ChatMessage = Backbone.Model.extend({

        defaults: function() {
            return {
                header: null,
                msg: null
            };
        },

        initialize: function(attributes, options) {

            if(!attributes.header.type && attributes.msg.type) {
                attributes.header.type = attributes.msg.type;
            }
        },
        
        /**
         * Get message header.
         * @return {MessageHeader}.
         */
        header: function() {
            return this.get("header");
        },

        /**
         * Get message body.
         * @return {Message} i.e. TagCreateMessage
         */
        msg: function() {
            return this.get("msg");
        },
        
        urlRoot: function() {
            return this.header().url() + this.msg().url();
        },

        toJSON: function() {
            return _.extend({}, this.header(), this.msg());
        },
        
        parse: function(response) {
            return {
                id: response.header.id,
                header: new messages.MessageHeader(response.header),
                msg: messages.messageFactory.create(response.header, response.msg)
            };
        },
        
        /**
         * Cross domain compatible sync
         */
        sync: xdBackbone.sync,

        msgType: function() {
            var header = this.get("header");
            if(header) {
                return header.type;
            } else {
                return null;
            }
        }
    });

    /**
     * Chat message collection.
     * @constructor
     * @param {ChatMessage[]} models (optional)
     * @param {Object} options
     *   chatSessionToken: Tokbox sessino token (required)
     *   userId: current user id (required)
     *   longPollErrorDelayMs: (optional)
     */
    var ChatMessageCollection = Backbone.Collection.extend({
        model: ChatMessage,
        
        url: "/chat/messages",

        initialize: function(models, options) {
            this.chatSessionToken = options.chatSessionToken;
            this.userId = options.userId;
            this.longPollErrorDelayMs = 10000 || options.longPollErrorDelayMs;
            
            //define long poll callback outside of longPoll function
            //to cut down on memory usage since this function is
            //call frequently.
            var that=this;
            this.longPollCallback = function(success, response) {
                if(success) {
                    that.longPoll.call(that);
                } else {
                    setTimeout(function() {
                        that.longPoll.call(that);
                    }, that.longPollErrorDelayMs);
                }
            };
        },

        remove: function(models, options) {
            //no-op
        },

        sync: function(method, collection, options) {
            if(method == 'read') {
                var last = this.last();
                var asOf = last ? last.attributes.header.timestamp : 0;

                var data = {
                    chatSessionToken: this.chatSessionToken,
                    userId: this.userId,
                    asOf: asOf
                };

                options.data = data;
            }

            return xdBackbone.sync(method, collection, options);
        },

        longPoll: function() {
            this.fetch({add: true, silent: false, complete: this.longPollCallback});
        }
    });

    return {
        ChatMessage: ChatMessage,
        ChatMessageCollection: ChatMessageCollection,
    }
});
