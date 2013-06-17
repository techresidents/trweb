define(/** @exports core/view */[
    'jquery',
    'underscore',
    'backbone',
    './base',
    './format'
], function($, _, Backbone, base, format) {

    var View = Backbone.View.extend(
    /** @lends module:core/view~View.prototype */{

        /**
         * View base class.
         * @constructs
         */
        constructor: function() {
            // map of event listeners from cid of component adding
            // events to event object.
            this.eventListeners = {};

            Backbone.View.prototype.constructor.apply(this, arguments);
        },

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
         * @param {string} cid Component id of component adding listener
         * @param {string} eventName Event name
         * @param {function} method Callback method
         * @param {object} context Context to invoke callback with
         * @param {string} [selector] Event selector
         */
        addEventListener: function(cid, eventName, method, context, selector) {
            var namespace = '.eventListener' + cid + this.cid;

            if(!_.isFunction(method)) {
                throw new Error('method must be a function');
            }
            
            //add namespace to event to make removing all event listeners easy
            eventName += namespace;

            //bind context to method
            method = _.bind(method, context);

            if(!selector) {
                this.$el.bind(eventName, method);
            } else {
                this.$el.delegate(selector, eventName, method);
            }
            
            //add to event listeners map
            if(!this.eventListeners.hasOwnProperty(cid)) {
                this.eventListeners[cid] = cid;
            }
            return this;
        },

        /**
         * Remove event listener
         * @param {string} cid Component id to remove listeners for
         * @param {string} eventName Event name
         */
        removeEventListener: function(cid, eventName) {
            var namespace = '.eventListener' + cid + this.cid;
            eventName += namespace;
            this.$el.unbind(eventName);
        },
        
        /**
         * Remove all event listeners
         * @param {string} cid Component id to remove listeners for.
         *  If cid is  not provided, all event listeners will be removed.
         */
        removeEventListeners: function(cid) {
            if(cid) {
                var namespace = '.eventListener' + cid + this.cid;
                this.$el.unbind(namespace);
                delete this.eventListeners[cid];
            } else {
                _.each(this.eventListeners, function(value, key) {
                    var namespace = '.eventListener' + key;
                    this.$el.unbind(namespace);
                    delete this.eventListeners[key];
                }, this);
            }
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
         * Prepend view to the dom at the element specified in selector.
         * Additionally this method will re-render and  re-delegate
         * view events.
         * @param {module:core/view~View} view View object to prepend
         * @param {string} [selector] Selector to prepend view to. If
         *  not provided the view will be appened to this.$el.
         * @returns {module:core/view~View} this
         */
        prepend: function(view, selector) {
            var target = selector ? this.$(selector) : this.$el;
            target.prepend(view.render().el);
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
         * @param {string} selector Selector for dom element to set.
         * @returns {module:core/view~View} this
         */
        html: function(view, selector) {
            var target = this.$(selector);
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
        },

        /**
         * @returns {boolean} true if is an alert view, false otherwise.
         */
        isAlert: function() {
            return false;
        },

        /**
         * @returns {boolean} true if is a modal view, false otherwise.
         */
        isModal: function() {
            return false;
        }
    });

    return {
        View: View
    };
});
