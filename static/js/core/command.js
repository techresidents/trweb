define([
    'jQuery',
    'Underscore',
    'core/base',
    'core/facade',
], function($, _, base, facade) { 

    var Command = function(options) {
        this.facade = facade.getInstance();
        this.options = options || {};
        this.initialize.apply(this, arguments);
    };
    Command.extend = base.extend;

    _.extend(Command.prototype, {

        initialize: function() {},
        
        execute: function() {},

        },
        
    });

    return {
        Command: Command,
    };
});
