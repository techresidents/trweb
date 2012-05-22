define([
    'jQuery',
    'Underscore',
    'core/base',
    'core/facade',
], function($, _, base, facade) { 

    var Mediator = function(options) {
        this.facade = facade.getInstance();
        this.options = options || {};
        this.initialize.apply(this, arguments);
        this.registerNotifications();
    };

    Mediator.extend = base.extend;

    _.extend(Mediator.prototype, {

        name: null,

        initialize: function() {},

        notifications: {},

        registerNotifications: function(notifications) {
            notifications = notifications || this.notifications;
            for(var key in notifications) {
                var method = this[notifications[key]];
                if(!_.isFunction(method)) {
                    throw new Error('Method "' + notifications[key] + '" does not exist');
                }
                facade.getInstance().on(key, method, this);
            }
        },

        unregisterNotifications: function(notifications) {
            notifications = notifications || this.notifications;
            for(var key in notifications) {
                var method = this[notifications[key]];
                if(!_.isFunction(method)) {
                    throw new Error('Method "' + notifications[key] + '" does not exist');
                }
                facade.getInstance().off(key, method, this);
            }
        },
        
    });

    return {
        Mediator: Mediator,
    };
});
