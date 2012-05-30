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
    });


    var MacroCommand = Command.extend({

        subCommands: [],

        addSubCommand: function(command) {
            this.subCommands.push(command);
        },

        executeSubCommands: function() {
            for(var i =0; i < this.subCommands.length; i++) {
                var command = new this.subCommands[i]();
                command.execute();
            }
        },

        execute: function() {
            this.executeSubCommands();
        },

    });

    return {
        Command: Command,
        MacroCommand: MacroCommand,
    };
});
