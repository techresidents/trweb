define(/** @exports core/notification */[
    'jquery',
    'underscore',
    'backbone',
    './base'
], function($, _, Backbone, base) { 

    /**
     * NotificationBus constructor.
     * @constructor
     */
    var NotificationBus = function(options) {
        this._events = Backbone.Events;
        this.options = options || {};
        this.initialize.apply(this, arguments);
    };
    NotificationBus.extend = base.extend;

    _.extend(NotificationBus.prototype, 
    /** @lends module:core/notification~NotificationBus.prototype */ {

        initialize: function() {},

        /**
         * Bind notification callback.
         * @param {string} notifications Space delimited notification names
         * @param {function} callback to be invoked on notifications
         * @param {context} context Context to invoke callback with
         */
        on: function(notifications, callback, context) {
            return this._events.on(notifications, callback, context);
        },

        /**
         * Unbind notification callback.
         * @param {string} notifications Space delimited notification names
         * @param {function} callback Callback
         * @param {context} context Context
         */
        off: function(notifications, callback, context) {
            return this._events.off(notifications, callback, context);
        },

        /**
         * Trigger notifications.
         * @param {string} notifications Space delimited notification names
         */
        trigger: function(notifications) {
            return this._events.trigger(arguments);
        }
    });

    return {
        bus: new NotificationBus()
    };
});
