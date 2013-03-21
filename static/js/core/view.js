define(/** @exports core/view */[
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
    var View = Backbone.View.extend(
    /** @lends module:core/view~View.prototype */{

        fmt: format,

        /**
         * Trigger dom event
         * @param {string} eventName Event name
         * @param {object} [args] Args object
         */
        triggerEvent: function(eventName, args) {
            this.$el.trigger(eventName, args);
        },
        
        /**
         * Add event listener
         * @param {string} eventName Event name
         * @param {function} method Callback method
         * @param {object} context Context to invoke callback with
         * @param {string} [selector] Event selector
         */
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

        /**
         * Remove event listener
         * @param {string} eventName Event name
         */
        removeEventListener: function(eventName) {
            var namespace = '.eventListener' + this.cid;
            eventName += namespace;
            this.$el.unbind(eventName);
        },
        
        /**
         * Remove all event listeners
         */
        removeEventListeners: function() {
            var namespace = '.eventListener' + this.cid;
            this.$el.unbind(namespace);
        },
        
        /**
         * listenTo override which ensures that the listener is still
         * present before invoking callback. This is to work around
         * Backbone a bug.
         * @param {object} obj Object to listen to
         * @param {string} name Space delimited event names
         * @param {function} callback Callback to invoke
         */
        listenTo: function(obj, name, callback) {
            var wrapper = function() {
                if(this._listeners && !_.isEmpty(this._listeners)) {
                    callback.apply(this, arguments);
                }
            };

            Backbone.View.prototype.listenTo.call(this, obj, name, wrapper);
        },

        /**
         * Append view to the dom at the element specified in selector.
         * Additionally this method will re-render and  re-delegate
         * view events.
         * @param {module:core/view~View} view View object to append
         * @param {string} [selector] Selector to append view to. If
         *  not provided the view will be appened to this.$el.
         * @returns {module:core/view~View} this
         */
        append: function(view, selector) {
            var target = selector ? this.$(selector) : this.$el;
            target.append(view.render().el);
            view.delegateEvents();
            return this;
        },

        /**
         * Assign view to dom at the element specified in selector.
         * This will result in a view.setElement() and view.render().
         * @param {module:core/view~View} view View object to assign
         * @param {string} selector Selector to append view to.
         * @returns {module:core/view~View} this
         */
        assign: function(view, selector) {
            view.setElement(this.$(selector)).render();
            return this;
        },

        /**
         * Set the html in the dom at the element specified in selector to
         * view.  Additionally this method will re-render and re-delegate
         * view events.
         * @param {module:core/view~View} view View object
         * @param {string} [selector] Selector for dom element to set. If
         *  html inside of. If not provided this.$el will be used.
         * @returns {module:core/view~View} this
         */
        html: function(view, selector) {
            var target = selector ? this.$(selector) : this.$el;
            target.html(view.render().el);
            view.delegateEvents();
            return this;
        },

        /**
         * Destroy all child views by calling remove() and undelegateEvents().
         * <br>
         * For childViews to be destroyed the view must contain a 'childViews'
         * property which is an array of child View objects or a method returning
         * an array of child View objects.
         */
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
        
        /**
         * Destroy the view and all of is child views.
         * <br>
         * For childViews to be destroyed the view must contain a 'childViews'
         * property which is an array of child View objects or a method returning
         * an array of child View objects.
         */
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
            this.removeEventListeners();
        }
    });

    return {
        View: View
    };
});
