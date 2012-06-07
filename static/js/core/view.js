define([
    'jQuery',
    'Underscore',
    'Backbone',
], function($, _, Backbone) {

    /**
     * View base class.
     * @constructor
     */
    var View = Backbone.View.extend({

        triggerEvent: function(eventName, args) {
            this.$el.trigger(eventName, args);
        },
        
        addEventListener: function(eventName, method, context, selector) {
            var namespace = '.eventListener' + this.cid;

            if(!_.isFunction(method)) {
                throw new Error('method must be a function');
            }
            
            //add namespace to event to make removing all event listeners easy
            eventName += namespace;

            //bind context to method
            method = _.bind(method, context);

            if(selector) {
                this.$el.bind(eventName, method);
            } else {
                this.$el.delegate(selector, eventName, method);
            }
            return this;
        },

        removeEventListener: function(eventName) {
            var namespace = '.eventListener' + this.cid;
            eventName += namespace;
            this.$el.unbind(eventName);
        },
        
        removeEventListeners: function() {
            var namespace = '.eventListener' + this.cid;
            this.$el.unbind(namespace);
        },
    });
    
    return {
        View: View,
    };
});
