define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone) {
    
    /**
     * Accordion Item Model
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var AccordionItemModel = Backbone.Model.extend({

        defaults: {
            name: null,
            title: null,
            viewOrFactory: null,
            expandable: true,
            open: true
        },

        name: function() {
            return this.get('name');
        },

        title: function() {
            return this.get('title');
        },

        viewOrFactory: function() {
            return this.get('viewOrFactory');
        },

        expandable: function() {
            return this.get('expandable');
        },

        open: function() {
            return this.get('open');
        }
    });

    /**
     * Accordion Item Collection
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var AccordionItemCollection = Backbone.Collection.extend({
        model: AccordionItemModel
    });

    return {
        AccordionItemModel: AccordionItemModel,
        AccordionItemCollection: AccordionItemCollection
    };
});
