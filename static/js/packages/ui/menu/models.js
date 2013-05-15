define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone) {
    
    /**
     * Menu item model
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var MenuItem = Backbone.Model.extend({

        defaults: {
            key: null,
            label: null,
            enabled: true,
            visible: true,
            handler: null
        },

        key: function() {
            return this.get('key');
        },

        label: function() {
            return this.get('label');
        },
        
        enabled: function() {
            return this.get('enabled');
        },

        visible: function() {
            return this.get('visible');
        },

        handler: function() {
            return this.get('handler');
        }
    });

    /**
     * MenuItemCollection
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var MenuItemCollection = Backbone.Collection.extend({
        model: MenuItem
    });

    return {
        MenuItem: MenuItem,
        MenuItemCollection: MenuItemCollection
    };
});
