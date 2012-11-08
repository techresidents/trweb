define([
    'jquery',
    'underscore',
    'core/base',
    'core/facade'
], function($, _, base, facade) { 

    /**
     * Command base class.
     * @constructor
     * 
     * All commands should inherit from this class and override 
     * the execute method. The execute method should receive a 
     * single 'options' argument. Options will be a object literal
     * containing the execution arguments.
     *
     * All commands must be short lived and should NOT maintain
     * state. Typically a Command will be registered with facade,
     * and associated with a notification.
     *
     * The facade will then instantiate the command in response
     * to the associated notification and invoke the command's
     * execute method.
     *
     * All non-async commands must be return a boolean value
     * from the execute() method indicating success or failure. 
     * Based on this value options.onSuccess or options.onError
     * callbacks with be invoked if provided.
     */
    var Command = function() {
        this.facade = facade.getInstance();
        this.initialize.apply(this, arguments);
    };
    Command.extend = base.extend;

    _.extend(Command.prototype, {
        
        /**
         * Overriden by subclass.
         */
        initialize: function() {},
        
        /**
         * Overriden by sublcass.
         * @param {Object} options
         *   {function} onSuccess optional callback
         *   {function} onError optional callback
         *   {Object} context optional callback context
         *
         *   Note that all callback will be invoked with
         *   the sample options argument as the sole parameter.
         */
        execute: function() {},
        
        /**
         * Wrapper around execute which will invoke onSuccess and
         * onError callbacks. Under normal circumstances this 
         * should not beed to be overriden.
         */
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
        }
    });

    /**
     * Async command base class.
     * @constructor
     *
     * This class should be subclassed by async commands.
     *
     * Convenience onSuccess and onError methods are provided
     * which are intended to be passed to the async facility
     * performing the operaion. This is typically an Ajax 
     * request through a library which supports invoking
     * a success or error callback.
     *
     * Simply pass this.onSuccess and this.onError to your
     * Ajax library and these methods will take care of
     * invoking the user specified callbacks in options.onSuccess
     * and options.onError (if provided).
     *
     * Since the arguments passed to this.onSuccess and this.onError
     * by the Ajax library are dynamic, this class provides 
     * asyncCallbackArgs, asyncSuccessCallbackArgs, and asyncErrorCallbackArgs
     * properties which should be overriden with the argument names
     * so that arguments can in turn be passed meaningfully to
     * the user specified callbacks.
     *
     * Note that the options.onSuccess and options.onError will be invoked
     * with the following two arguments:
     *
     * 1) {Object} options (same options passed into execute method())
     * 2) {Object} response object containing boolean status and
     *             arguments named in the callback args arrays.
     */
    var AsyncCommand = Command.extend({

        /**
         * Overriden by sublcass.
         */
        execute: function() {},

        /**
         * Overriden by sublcass.
         */
        asyncCallbackArgs: [],

        /**
         * Overriden by sublcass if asyncCallbackArgs not provided.
         */
        asyncSuccessCallbackArgs: [],

        /**
         * Overriden by sublcass if asyncCallbackArgs not provided.
         */
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
                    result: this._argsToObject(argNames, arguments)
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
                    result: this._argsToObject(argNames, arguments)
                };

                this.options.onError.call(
                    this.options.context || this,
                    this.options,
                    result);
            }
        },

        _argsToObject: function(argNames, args) {
            var result = {};
            var i;

            if(argNames && argNames.length && args && args.length) {
                var length = argNames.length <= args.length ? argNames.length : args.length;
                for(i = 0; i < length; i++) {
                    result[argNames[i]] = args[i];
                }
            }

            return result;
        }

    });


    /**
     * Macro Command
     * @constructor
     */
    var MacroCommand = Command.extend({

        subCommands: [],

        /**
         * Add sub command.
         * @param {function} command sub command constructor
         */
        addSubCommand: function(command) {
            this.subCommands.push(command);
        },

        executeSubCommands: function() {
            var i;
            for(i =0; i < this.subCommands.length; i++) {
                var command = new this.subCommands[i]();
                command.execute.apply(command, arguments);
            }
        },

        execute: function() {
            this.executeSubCommands.apply(this, arguments);
        }
    });


    return {
        Command: Command,
        AsyncCommand: AsyncCommand,
        MacroCommand: MacroCommand
    };

});
