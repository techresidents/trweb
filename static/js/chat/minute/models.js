define([
    'jQuery',
    'Underscore',
    'Backbone'
], function($, _, Backbone) {
    
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
                endTimestamp: null
            };
        },
        
        initialize: function(attributes, options) {
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
        }
    });


    /**
     * Chat Minute collection.
     */
    var MinuteCollection = Backbone.Collection.extend({

        model: Minute,
        
        /**
         * Return the currently active Minute. 
         */
        active: function() {
            var minutes = this.where({
                endTimestamp: null
            });
            return _.last(minutes);
        }
    });

    return {
        Minute: Minute,
        MinuteCollection: MinuteCollection
    };
});
