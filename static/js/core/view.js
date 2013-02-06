define([
    'jquery',
    'underscore',
    'backbone',
    'core/base',
    'core/format'
], function($, _, Backbone, base, format) {

    /**
     * View base class.
     * @constructor
     */
    var View = Backbone.View.extend({

        fmt: format,

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

        destroyChildViews: function() {
            var childViews = base.getValue(this, 'childViews');
            if(this.childViews) {
                _.each(childViews, function(view) {
                    if(view) {
                        if(_.isFunction(view.destroy)) {
                            view.destroy();
                        } else {
                            view.remove();
                            view.undelegateEvents();
                        }
                    }
                });
            }
        },

        destroy: function() {
            var childViews = base.getValue(this, 'childViews');
            if(this.childViews) {
                _.each(childViews, function(view) {
                    if(view) {
                        if(_.isFunction(view.destroy)) {
                            view.destroy();
                        } else {
                            view.remove();
                            view.undelegateEvents();
                        }
                    }
                });
            }

            this.remove();
            this.undelegateEvents();
        }
    });
    
    return {
        View: View
    };
});
