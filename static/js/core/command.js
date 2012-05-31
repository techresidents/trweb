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

        run: function(options) {
            var result = this.execute.apply(this, arguments);
            if(options) {
                if(result && _.isFunction(options.onSuccess)) {
                    options.onSuccess.apply(this, arguments);
                } else if(!result && _.isFunction(options.onError)) {
                    options.onError.apply(this, arguments);
                }
            }

            return result;
        },
    });


    var MacroCommand = Command.extend({

        subCommands: [],

        addSubCommand: function(command) {
            this.subCommands.push(command);
        },

        executeSubCommands: function() {
            for(var i =0; i < this.subCommands.length; i++) {
                var command = new this.subCommands[i]();
                command.execute.apply(command, arguments);
            }
        },

        execute: function() {
            this.executeSubCommands.apply(this, arguments);
        },
    });

    return {
        Command: Command,
        MacroCommand: MacroCommand,
    };
});
