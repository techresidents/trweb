define([
    'jQuery',
    'Underscore',
    'Backbone',
    'xd/xd',
    'xd/backbone',
    'chat/message/messages',
], function($, _, Backbone, xd, xdBackbone, messages) {
    
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

        header: function() {
            return this.get("header");
        },

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

    var ChatMessageCollection = Backbone.Collection.extend({
        model: ChatMessage,
        
        url: "/chat/messages",

        initialize: function(models, options) {
            this.chatSessionToken = options.chatSessionToken;
            this.userId = options.userId;
            this.longPollErrorDelayMs = 10000;
            
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
