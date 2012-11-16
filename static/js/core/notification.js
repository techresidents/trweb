define([
    'jquery',
    'underscore',
    'backbone',
    'core/base'
], function($, _, Backbone, base) { 

    var NotificationBus = function(options) {
        this._events = Backbone.Events;
        this.options = options || {};
        this.initialize.apply(this, arguments);
    };
    NotificationBus.extend = base.extend;

    _.extend(NotificationBus.prototype, {

        initialize: function() {},

        on: function(notifications, callback, context) {
            return this._events.on(notifications, callback, context);
        },

        off: function(notifications, callback, context) {
            return this._events.off(notifications, callback, context);
        },

        trigger: function(notifications) {
            return this._events.trigger(arguments);
        }
    });

    return {
        bus: new NotificationBus()
    };
});
