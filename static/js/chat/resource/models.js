define([
    'jQuery',
    'Underscore',
    'Backbone',
], function($, _, Backbone) {
    

    var ResourcesValueObject = Backbone.Model.extend({
        
        localStorage: new Backbone.LocalStorage('ResourcesValueObject'),
        
        defaults: function() {
            return {
                resources: null,
                selected: null,
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
        },
    });

    return {
        ResourcesValueObject: ResourcesValueObject,
    };
});
