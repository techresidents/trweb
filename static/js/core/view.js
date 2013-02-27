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

        listenTo: function(obj, name, callback) {
            var wrapper = function() {
                if(this._listeners && !_.isEmpty(this._listeners)) {
                    callback.apply(this, arguments);
                }
            };

            Backbone.View.prototype.listenTo.call(this, obj, name, wrapper);
        },

        append: function(view, selector) {
            var target = selector ? this.$(selector) : this.$el;
            target.append(view.render().el);
            view.delegateEvents();
            return this;
        },

        assign: function(view, selector) {
            view.setElement(this.$(selector)).render();
            return this;
        },

        html: function(view, selector) {
            var target = selector ? this.$(selector) : this.$el;
            target.html(view.render().el);
            view.delegateEvents();
            return this;
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
