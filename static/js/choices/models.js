define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone) {
    
    /**
     * Choice
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var Choice = Backbone.Model.extend({

        defaults: {
            value: null,
            selected: false
        },

        value: function() {
            return this.get('value');
        },
        
        selected: function() {
            return this.get('selected');
        },

        toJSON: function() {
            return {
                id: this.id || this.cid,
                value: this.value(),
                selected: this.selected()
            };
        }

    });

    /**
     * ChoiceCollection
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var ChoiceCollection = Backbone.Collection.extend({
        model: Choice
    });

    return {
        Choice: Choice,
        ChoiceCollection: ChoiceCollection
    };
});
