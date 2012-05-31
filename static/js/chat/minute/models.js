define([
    'jQuery',
    'Underscore',
    'Backbone',
    'xd/xd',
    'xd/backbone',
    'chat/message/messages',
], function($, _, Backbone, xd, xdBackbone, messages) {
    
    /**
     * Chat Minute model.
     * @constructor
     * @param {Object} attributes Optional model attributes
     * @param {Object} options Optional options
     */
    var Minute = Backbone.Model.extend({
            
        idAttribute: 'minuteId',

        defaults: function() {
            return {
                minuteId: null,
                userId: null,
                topicId: null,
                startTimestamp: null,
                endTimestamp: null,
            };
        },
        
        initialize: function(attributes, options) {
            this.reinitialize(attributes, options);
        },


        reinitialize: function(attributes, options) {

            var optionsProvided = false;

            if(options && options.header && options.msg) {
                this.header = options.header;
                this.msg = options.msg;
                optionsProvided = true;
            } else {
                this.header = new messages.MessageHeader();
                this.msg = new messages.MinuteCreateMessage();
            }

            if(optionsProvided) {
                this.set({
                    minuteId: this.msg.minuteId,
                    userId: this.header.userId,
                    topicId: this.msg.topicId,
                    startTimestamp: this.msg.startTimestamp,
                    endTimestamp: this.msg.endTimestamp,
                });
            }
        },

        userId: function() {
            return this.get('userId');
        },

        setUserId: function(userId) {
            this.set({userId: userId});
            return this;
        },

        topicId: function() {
            return this.get('topicId');
        },

        setTopicId: function(topicId) {
            this.set({topicId: topicId});
            return this;
        },

        startTimestamp: function() {
            return this.get('startTimestamp');
        },

        setStartTimestamp: function(startTimestamp) {
            this.set({startTimestamp: startTimestamp});
            return this;
        },

        endTimestamp: function() {
            return this.get('endTimestamp');
        },

        setEndTimestamp: function(endTimestamp) {
            this.set({endTimestamp: endTimestamp});
            return this;
        },

        urlRoot: function() {
            return this.header.url() + this.msg.url();
        },

        /**
         * Cross domain compatible sync function.
         */
        sync: xdBackbone.sync,

        parse: function(response) {
            this.header = new messages.MessageHeader(response.header);
            this.msg = new messages.MinuteCreateMessage(response.msg);

            return {
                minuteId: response.msg.minuteId,
                userId: response.header.userId,
                topicId: response.msg.topicId,
                startTimestamp: response.msg.startTimestamp,
                endTimestamp: response.msg.endTimestamp,
            };
        },
    });

    /**
     * Chat Minute collection.
     */
    var MinuteCollection = Backbone.Collection.extend({

        model: Minute,
        
        /**
         * Cross domain compatible sync function.
         */
        sync: xdBackbone.sync,


        /**
         * Return the currently active Minute. 
         */
        active: function() {
            var minutes = this.where({
                endTimestamp: null,
            });
            return _.last(minutes);
        }
    });

    return {
        Minute: Minute,
        MinuteCollection: MinuteCollection,
    };
});
