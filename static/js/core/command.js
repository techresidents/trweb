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

    var AsyncCommand = Command.extend({

        execute: function() {},

        asyncCallbackArgs: [],

        asyncSuccessCallbackArgs: [],

        asyncErrorCallbackArgs: [],

        run: function(options) {
            this.options = options;
            this.execute.apply(this, arguments);
        },

        onSuccess: function() {
            if(this.options.onSuccess) {
                
                var argNames;
                if(this.asyncCallbackArgs.length > this.asyncSuccessCallbackArgs.length) {
                    argNames= this.asyncCallbackArgs;
                } else {
                    argNames = this.asyncSuccessCallbackArgs;
                }

                var result = {
                    status: true,
                    result: this._argsToObject(argNames, arguments),
                };

                this.options.onSuccess.call(
                    this.options.context || this,
                    this.options,
                    result);
            }
        },

        onError: function() {
            if(this.options.onError) {

                var argNames;
                if(this.asyncCallbackArgs.length > this.asyncErrorCallbackArgs.length) {
                    argNames= this.asyncCallbackArgs;
                } else {
                    argNames = this.asyncErrorCallbackArgs;
                }

                var result = {
                    status: false,
                    result: this._argsToObject(argNames, arguments),
                };

                this.options.onError.call(
                    this.options.context || this,
                    this.options,
                    result);
            }
        },

        _argsToObject: function(argNames, args) {
            var result = {};
            if(argNames && argNames.length && args && args.length) {
                var length = argNames.length <= args.length ? argNames.length : args.length;
                for(var i = 0; i < length; i++) {
                    result[argNames[i]] = args[i];
                }
            }

            return result;
        }

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
        AsyncCommand: AsyncCommand,
        MacroCommand: MacroCommand,
    };

});
