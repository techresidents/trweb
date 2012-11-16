define([
    'jquery',
    'underscore',
    'backbone',
    'backbone.localStorage'
], function($, _, Backbone, none) {
    
    /**
     * Resources Value Object Model
     * @constructor
     * @param {Object} attributes
     *   {ResourceCollection} resources
     *   {Resource} selected
     */
    var ResourcesValueObject = Backbone.Model.extend({
        
        localStorage: new Backbone.LocalStorage('ResourcesValueObject'),
        
        defaults: function() {
            return {
                resources: null,
                selected: null
            };
        },
        
        initialize: function(attributes, options) {
        },

        resources: function() {
            return this.get('resources');
        },
       
        selected: function() {
            return this.get('selected');
        },

        select: function(resource) {
            return this.set({selected: resource});
        }
    });

    return {
        ResourcesValueObject: ResourcesValueObject
    };
});
