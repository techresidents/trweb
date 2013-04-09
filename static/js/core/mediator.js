define(/** @exports core/mediator */[
    'jquery',
    'underscore',
    'core/base',
    'core/facade'
], function($, _, base, facade) { 

    /**
     * Mediator base class.
     * @constructor
     */
    var Mediator = function(options) {
        this.cid = _.uniqueId('mediator');
        this.facade = facade.getInstance();
        this.options = options || {};
        this.registerNotifications();
        this.initialize.apply(this, arguments);
    };

    Mediator.extend = base.extend;

    _.extend(Mediator.prototype, 
    /** @lends module:core/mediator~Mediator.prototype */ {
        
        /**
         * Overriden in subclass.
         */
        name: null,
        
        /**
         * Overriden in subclass.
         */
        initialize: function() {},

        /**
         * Overriden in subclass.
         * Notitifcation handler tuples, i.e. [ ['NOTIFCATION_NAME', 'handler'], ]
         */
        notifications: [],


        /**
         * Register notification handlers.
         * @param {array} notifications Array of notification tuples,
         *  [ ['NOTIFICATION_NAME', 'handlerName'] ]
         */
        registerNotifications: function(notifications) {
            var index;

            notifications = notifications || base.getValue(this, 'notifications');
            if(!_.isArray(notifications)) {
                throw new Error('notifications must be array of [notificationName, methodName] tuples');
            }

            for(index = 0; index <  notifications.length; index++) {
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

        /**
         * Unregister notification handlers.
         * @param {array} notifications Array of notification tuples,
         *  [ ['NOTIFICATION_NAME', 'handlerName'] ]
         */
        unregisterNotifications: function(notifications) {
            var index;

            notifications = notifications || base.getValue(this, 'notifications');
            if(!_.isArray(notifications)) {
                throw new Error('notifications must be array of [notificationName, methodName] tuples');
            }

            for(index = 0; index <  notifications.length; index++) {
                var tuple = notifications[index];
                var key = tuple[0];
                var methodName = tuple[1];
                var method = this[methodName];

                if(!_.isFunction(method)) {
                    throw new Error('Method "' + methodName + '" does not exist');
                }
                facade.getInstance().off(key, method, this);
            }
        }
        
    });

    return {
        Mediator: Mediator
    };
});
