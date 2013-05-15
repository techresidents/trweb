define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone) {
    
    /**
     * Filter View Model
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var FilterView = Backbone.Model.extend({

        idAttribute: 'field',

        defaults: {
            field: null,
            view: null
        },

        field: function() {
            return this.get('field');
        },
        
        view: function() {
            return this.get('view');
        }

    });

    /**
     * Filter View Collection
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var FilterViewCollection = Backbone.Collection.extend({
        model: FilterView
    });

    return {
        FilterView: FilterView,
        FilterViewCollection: FilterViewCollection
    };
});
