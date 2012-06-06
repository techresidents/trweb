define([
    'jQuery',
    'Underscore',
    'Backbone',
], function($, _, Backbone) {
    

    /**
     * Agenda model encapsulates chat topics and keeps track of
     * the active / selected topic.
     * @constructor
     * @param {Object} attributes Optional model attributes
     * @param {Object} options Optional model options.
     */
    var AgendaValueObject = Backbone.Model.extend({
        
        /**
         * Agenda model is persisted locally.
         */
        localStorage: new Backbone.LocalStorage('Agenda'),
        
        defaults: function() {
            return {
                selected: null,
                active: null,
                topics: null,
                minutes: null,
            };
        },
        
        initialize: function(attributes, options) {
        },
       
        /**
         * Get topics on the agenda.
         * @return {TopicCollection}
         */
        topics: function() {
            return this.get('topics');
        },

        minutes: function() {
            return this.get('minutes');
        },


        /**
         * Get the selected topic.
         * @return {Topic} Selected topic or null if none selected.
         */
        selected: function() {
            return this.get('selected');
        },

        select: function(topic) {
            return this.set({selected: topic});
        },
        
        /**
         * Get the active topic.
         * @return {Topic} Active topic or null if none active.
         */
        active: function() {
            return this.get('active');
        },

        activate: function(topic) {
            return this.set({active: topic});
        },

    });

    return {
        AgendaValueObject: AgendaValueObject,
    };
});
