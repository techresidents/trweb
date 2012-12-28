define([
    'jquery',
    'underscore',
    'backbone',
    'backbone.localStorage'
], function($, _, Backbone, none) {
    
    /**
     * Discuss View VO Model.
     * @constructor
     * @param {Object} attributes
     * @param {Object} options
     */
    var DiscussValueObject = Backbone.Model.extend({
        
        /**
         * Store model in local storage
         */
        localStorage: new Backbone.LocalStorage("DiscussViewModel"),

        defaults: function() {
            return {
                rootTopic: null,
                activeTopic: null,
                nextTopic: null,
                skew: 0
            };
        },

        rootTopic: function() {
            return this.get('rootTopic');
        },
        
        setRootTopic: function(rootTopic) {
            this.set({ rootTopic: rootTopic});
            return this;
        },

        activeTopic: function() {
            return this.get('activeTopic');
        },

        setActiveTopic: function(activeTopic) {
            this.set({ activeTopic: activeTopic});
            return this;
        },

        nextTopic: function() {
            return this.get('nextTopic');
        },
        
        setNextTopic: function(nextTopic) {
            this.set({ nextTopic: nextTopic});
            return this;
        },

        activeMinute: function() {
            return this.get('activeMinute');
        },

        setActiveMinute: function(activeMinute) {
            this.set({ activeMinute: activeMinute });
            return this;
        },

        skew: function() {
            return this.get('skew');
        },

        setSkew: function(skew) {
            this.set({ skew: skew });
        },

        toJSON: function() {
            return _.extend({}, {
                rootTopic: this.rootTopic() ? this.rootTopic().toJSON() : null,
                activeTopic: this.activeTopic() ? this.activeTopic().toJSON() : null,
                nextTopic: this.nextTopic() ? this.nextTopic().toJSON() : null,
                activeMinute: this.activeMinute() ? this.activeMinute().toJSON() : null
            });
        }
    });


    return {
        DiscussValueObject: DiscussValueObject
    };
});
