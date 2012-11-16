define([
    'jquery',
    'underscore',
    'backbone',
    'xd/xd',
    'xd/backbone',
    'chat/message/messages'
], function($, _, Backbone, xd, xdBackbone, messages) {
    
    /**
     * Represent chat messages from server.
     * @constructor
     * @param {Object} attributes model attributes (optional)
     * @param {Object} options
     *   header: chat message header (optional)
     *   msg: chat message body (optional)
     *
     * This model is the basis for all chat actions.
     * Every action is represented through the creation of a
     * ChatMessage which embodies the desired action.
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
            return "/chat/message";
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


        /**
         * Return message type.
         * @return {string}
         */
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
     */
    var ChatMessageCollection = Backbone.Collection.extend({
        model: ChatMessage,
        
        url: "/chat/messages",

        initialize: function(models, options) {
        },
        
        /**
         * Sort messages by timestamp.
         * It's important to ensure that the latest message is always
         * last, since this is used to calculate teh asOf timestamp
         * used in the fetch method. If this is not the case,
         * a tight loop could be created if the server sends
         * back messages out of order (should never happen)
         * where we keep polling for new messages and the same
         * old messages are returned over and over.
         */
        comparator: function(model) {
            return model.attributes.header.timestamp;
        },

        remove: function(models, options) {
            //no-op
        },

        sync: function(method, collection, options) {
            if(method === 'read') {
                var last = this.last();
                var asOf = last ? last.attributes.header.timestamp : 0;

                var data = {
                    asOf: asOf
                };

                options.data = data;
            }

            return xdBackbone.sync(method, collection, options);
        }
    });

    return {
        ChatMessage: ChatMessage,
        ChatMessageCollection: ChatMessageCollection
    };
});
