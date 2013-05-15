define([
    'jquery',
    'underscore',
    'backbone'
], function(
    $,
    _,
    Backbone) {

    /**
     * FacetItem model
     * @constructor
     * @param {Object} attributes
     * @param {Object} options
     */
    var FacetItem = Backbone.Model.extend({
        idAttribute: 'name',

        defaults: {
            name: null,
            count: null,
            enabled: false,
            enable_filter: null,
            disable_filter: null
        },
        
        name: function() {
            return this.get('name');
        },

        count: function() {
            return this.get('name');
        },

        enabled: function() {
            return this.get('enabled');
        },

        enable_filter: function() {
            return this.get('enable_filter');
        },

        disable_filter: function() {
            return this.get('disable_filter');
        }
    });

    /**
     * FacetItemCollection
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var FacetItemCollection = Backbone.Collection.extend({
        model: FacetItem
    });
    
    /**
     * Facet model
     * @constructor
     * @param {Object} attributes
     * @param {Object} options
     */
    var Facet = Backbone.Model.extend({
        idAttribute: 'name',

        defaults: function() {
            return {
                name: null,
                title: null,
                filter: null,
                items: new FacetItemCollection()
            };
        },

        name: function() {
            return this.get('name');
        },

        title: function() {
            return this.get('title');
        },

        filter: function() {
            return this.get('filter');
        },

        items:  function() {
            return this.get('items');
        },

        parse: function(response, options) {
            var result = {
                name: response.name,
                title: response.title,
                filter: response.filter,
                items: this.items().reset(response.items)
            };
            return result;
        }
    });

    /**
     * FacetCollection
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var FacetCollection = Backbone.Collection.extend({
        model: Facet,

        parse: function(response, options) {
            var i, result = [];
            for(i = 0; i<response.length; i++) {
                var model = new this.model();
                model.set(model.parse(response[i], options), options);
                result.push(model);
            }
            return result;
        }
    });

    return {
        Facet: Facet,
        FacetCollection: FacetCollection,
        FacetItem: FacetItem,
        FacetItemCollection: FacetItemCollection
    };
});
