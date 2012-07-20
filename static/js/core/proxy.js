define([
    'jQuery',
    'Underscore',
    'core/base',
    'core/facade'
], function($, _, base, facade) { 

    /**
     * Proxy base class.
     * @constructor.
     */
    var Proxy = function(options) {
        this.facade = facade.getInstance();
        this.options = options || {};
        this.initialize.apply(this, arguments);
    };

    Proxy.extend = base.extend;

    _.extend(Proxy.prototype, {
        
        /**
         * Overriden in subclass.
         */
        name: null,

        /**
         * Overriden in subclass.
         */
        initialize: function() {}
    });

    /**
     * Model Proxy base class.
     * @constructor
     */
    var ModelProxy = Proxy.extend({

        /**
         * Overriden in subclass.
         * Map model events to notifications, i.e. {'change': 'NOTIFICATION_NAME' }
         */
        eventNotifications:  [],

        constructor: function(options) {
            this.model = options.model;

            if(this.model) {
                this.model.on('all', this._onEvent, this);
            } else {
                throw new Error('model not provided');
            }

            ModelProxy.__super__.constructor.apply(this, arguments);
        },

        initialize: function(options) {},

        _onEvent: function(eventName) {
            var notifications = base.getValue(this, 'eventNotifications');
            var notificationName = notifications[eventName];
            if(notificationName) {
                this.facade.trigger(notificationName);
            }
        }
    });

    /**
     * Collection Proxy base class.
     * @constructor
     */
    var CollectionProxy = Proxy.extend({

        /**
         * Overriden in subclass.
         * Map collection events to notifications, i.e. {'change': 'NOTIFICATION_NAME' }
         */
        eventNotifications:  [],

        constructor: function(options) {
            this.collection = options.collection;
            if(this.collection) {
                this.collection.on('all', this._onEvent, this);
            } else {
                throw new Error('collection not provided');
            }

            CollectionProxy.__super__.constructor.apply(this, arguments);
        },

        /**
         * Overriden in subclass.
         */
        initialize: function(options) {},


        //convenience methods
        
        add: function() {
            return this.collection.add.apply(this.collection, arguments);
        },

        get: function() {
            return this.collection.get.apply(this.collection, arguments);
        },

        remove: function() {
            return this.collection.remove.apply(this.collection, arguments);
        },

        reset: function() {
            return this.collection.reset.apply(this.collection, arguments);
        },

        _onEvent: function(eventName) {
            var notifications = base.getValue(this, 'eventNotifications');
            var notificationName = notifications[eventName];
            if(notificationName) {
                this.facade.trigger(notificationName, {
                    collection: this.collection,
                    model: arguments[1]
                });
            }
        }
    });

    return {
        Proxy: Proxy,
        ModelProxy: ModelProxy,
        CollectionProxy: CollectionProxy
    };
});
