define([
    'jQuery',
    'Underscore',
    'core/base',
    'core/facade',
], function($, _, base, facade) { 

    var Mediator = function(options) {
        this.facade = facade.getInstance();
        this.options = options || {};
        this.registerNotifications();
        this.initialize.apply(this, arguments);
    };

    Mediator.extend = base.extend;

    _.extend(Mediator.prototype, {

        name: null,

        initialize: function() {},

        notifications: [],

        registerNotifications: function(notifications) {
            var notifications = notifications || base.getValue(this, 'notifications');
            if(!_.isArray(notifications)) {
                throw new Error('notifications must be array of [notificationName, methodName] tuples');
            }

            for(var index in notifications) {
                var tuple = notifications[index];
                var key = tuple[0];
                var methodName = tuple[1];
                var method = this[methodName];

                if(!_.isFunction(method)) {
                    throw new Error('Method "' + methodName + '" does not exist');
                }
                facade.getInstance().on(key, method, this);
            }
        },

        unregisterNotifications: function(notifications) {
            var notifications = notifications || base.getValue(this, 'notifications');
            if(!_.isArray(notifications)) {
                throw new Error('notifications must be array of [notificationName, methodName] tuples');
            }

            for(var index in notifications) {
                var tuple = notifications[index];
                var key = tuple[0];
                var methodName = tuple[1];
                var method = this[methodName];

                if(!_.isFunction(method)) {
                    throw new Error('Method "' + methodName + '" does not exist');
                }
                facade.getInstance().off(key, method, this);
            }
        },
        
    });

    return {
        Mediator: Mediator,
    };
});
