define([
    'jQuery',
    'Underscore',
    'Backbone',
], function($, _, Backbone) {
    
    /**
     * Discuss View Model.
     * @constructor
     */
    var DiscussValueObject = Backbone.Model.extend({

        localStorage: new Backbone.LocalStorage("DiscussViewModel"),

        defaults: function() {
            return {
                rootTopic: null,
                activeTopic: null,
                nextTopic: null,
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

        toJSON: function() {
            return _.extend({}, {
                rootTopic: this.rootTopic() ? this.rootTopic().toJSON() : null,
                activeTopic: this.activeTopic() ? this.activeTopic().toJSON() : null,
                nextTopic: this.nextTopic() ? this.nextTopic().toJSON() : null,
            });
        },
    });


    return {
        DiscussValueObject: DiscussValueObject,
    }
});
