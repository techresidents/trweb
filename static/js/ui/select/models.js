define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone) {
    
    /**
     * Selection
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var Selection = Backbone.Model.extend({

        defaults: {
            value: null,
            selected: false
        },

        value: function() {
            return this.get('value');
        },
        
        selected: function() {
            return this.get('selected');
        }
    });

    /**
     * SelectionCollection
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var SelectionCollection = Backbone.Collection.extend({
        model: Selection
    });

    return {
        Selection: Selection,
        SelectionCollection: SelectionCollection
    };
});
