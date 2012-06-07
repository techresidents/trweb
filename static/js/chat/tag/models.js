define([
    'jQuery',
    'Underscore',
    'Backbone',
], function($, _, Backbone) {
    
    /**
     * Chat Tag model.
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var Tag = Backbone.Model.extend({
            
        idAttribute: 'tagId',

        defaults: function() {
            return {
                tagId: null,
                userId: null,
                timestamp: null,
                minuteId: null,
                name: null,
                tagReferenceId: null,
            };
        },
        
        userId: function() {
            return this.get('userId');
        },

        setUserId: function(userId) {
            this.set({userId: userId});
            return this;
        },

        name: function() {
            return this.get('name');
        },

        setName: function(name) {
            this.set({name: name});
            return this;
        },

        minuteId: function() {
            return this.get('minuteId');
        },

        setMinuteId: function(minuteId) {
            this.set({minuteId: minuteId});
            return this;
        },

        tagReferenceId: function() {
            return this.get('tagReferenceId');
        },

        setTagReferenceId: function(tagReferenceId) {
            this.set({tagReferenceId: tagReferenceId});
            return this;
        },

        timestamp: function() {
            return this.get('timestamp');
        },

        setTimestamp: function(timestamp) {
            this.set({timestamp: timestamp});
            return this;
        },

        timestamp_as_date: function() {
            var timestamp = this.timestamp();
            if(timestamp) {
                var date = new Date();
                date.setTime(timestamp * 1000.0);
                return date;
            } else {
                return null;
            }
        },
    });


    /**
     * Chat Tag collection.
     */
    var TagCollection = Backbone.Collection.extend({

        model: Tag,
    });

    return {
        Tag: Tag,
        TagCollection: TagCollection,
    };
});
