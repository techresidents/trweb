define([
    'jQuery',
    'Underscore',
    'Backbone',
    'core/base',
], function($, _, Backbone, base) { 

    /**
     * Facde class.
     * @constructor
     * 
     * There is only one instance of the facade per application.
     * It is responsible for facilitating communication between
     * the disparate parts of the system.
     */
    var Facade = function(options) {
        this._events = _.extend({}, Backbone.Events);
        this._commands = {};
        this._mediators = {};
        this._proxies = {};
        this.options = options || {};
        this.initialize.apply(this, arguments);
    };
    Facade.extend = base.extend;

    _.extend(Facade.prototype, {

        initialize: function() {},

        on: function(notification, callback, context) {
            return this._events.on(notification, callback, context);
        },

        off: function(notification, callback, context) {
            return this._events.off(notification, callback, context);
        },

        trigger: function(notification) {
            return this._events.trigger.apply(this._events, arguments);
        },
        
        registerCommand: function(notification, commandClass) {
            if(!this._commands[notification]) {
                this._commands[notification] = function() {
                    var command = new commandClass();
                    command.run.apply(command, arguments);
                }
            }
            this.on(notification, this._commands[notification], this);
        },

        unregisterCommand: function(notification, commandClass) {
            this.off(notification, this._commands[commandClass], this);
        },

        registerMediator: function(mediator) {
            var name = base.getValue(mediator, 'name');
            if(name) {
                this._mediators[name] = mediator;
            } else {
                throw new Error('mediator missing "name" property or method');
            }
        },

        unregisterMediator: function(name) {
            delete this._mediators[name];
        },

        getMediator: function(name) {
            return this._mediators[name];
        },

        registerProxy: function(proxy) {
            var name = base.getValue(proxy, 'name');
            if(name) {
                this._proxies[name] = proxy;
            } else {
                throw new Error('proxy missing "name" property or method');
            }
        },

        unregisterProxy: function(name) {
            delete this._proxies[name];
        },

        getProxy: function(name) {
            return this._proxies[name];
        },

    });
   

    var facadeManager = _.extend({}, {
        _instance: null,

        getInstance: function() {
            if(!this._instance) {
                this._instance = new Facade();
            }
            return this._instance;
        },

        setInstance: function(instance) {
            if(this._instance) {
                throw new Error("facade already set");
            }
            this._instance = instance;
        },
    });

    return {
        getInstance: facadeManager.getInstance,
        setInstance: facadeManager.setInstance,
        Facade: Facade,
    };
});
