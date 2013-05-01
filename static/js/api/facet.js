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
            count: 0,
            on: false,
            on_filter: null,
            off_filter: null
        },
        
        name: function() {
            return this.get('name');
        },

        count: function() {
            return this.get('name');
        },

        on: function() {
            return this.get('on');
        },

        on_filter: function() {
            return this.get('on_filter');
        },

        off_filter: function() {
            return this.get('off_filter');
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
                items: new FacetItemCollection()
            };
        },

        name: function() {
            return this.get('name');
        },

        title: function() {
            return this.get('title');
        },

        items:  function() {
            return this.get('items');
        },

        parse: function(response, options) {
            var result = {
                name: response.name,
                title: response.title,
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
