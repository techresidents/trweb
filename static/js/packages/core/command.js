define(/** @exports core/command */[
    'jquery',
    'underscore',
    './base',
    './facade',
    './notifications'
], function(
    $,
    _,
    base,
    facade,
    notifications) { 

    /**
     * Command base class.
     * @constructor
     * @classdesc
     * All commands should inherit from this class and override 
     * the execute method. The execute method should receive a 
     * single 'options' argument. Options will be a object literal
     * containing the execution arguments.
     * <br><br>
     * All commands must be short lived and should NOT maintain
     * state. Typically a Command will be registered with the facade,
     * and associated with a notification.
     * <br><br>
     * The facade will then instantiate the command in response
     * to the associated notification and invoke the command's
     * execute method.
     * <br><br>
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

    _.extend(Command.prototype,
    /** @lends module:core/command~Command.prototype */ {
        
        /**
         * Overriden by subclass.
         */
        initialize: function() {},
        
        /**
         * Overriden by sublcass.
         * @param {Object} options Options object
         * @param {function} [options.onSuccess] Success callback which
         *   will be invoked with options object as sole parameter.
         * @param {function} [options.onError] Error callback which
         *   will be invoked with options object as sole parameter.
         * @param {object} [options.context] Callback context
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
     * @augments module:core/command~Command
     * @classdesc
     * This class should be subclassed by async commands.
     * <br><br>
     * Convenience onSuccess and onError methods are provided
     * which are intended to be passed to the async facility
     * performing the operaion. This is typically an Ajax 
     * request through a library which supports invoking
     * a success or error callback.
     * <br><br>
     * Simply pass this.onSuccess and this.onError to your
     * Ajax library and these methods will take care of
     * invoking the user specified callbacks in options.onSuccess
     * and options.onError (if provided).
     * <br><br>
     * Since the arguments passed to this.onSuccess and this.onError
     * by the Ajax library are dynamic, this class provides 
     * asyncCallbackArgs, asyncSuccessCallbackArgs, and asyncErrorCallbackArgs
     * properties which should be overriden with the argument names
     * so that arguments can in turn be passed meaningfully to
     * the user specified callbacks.
     * <br><br>
     * Note that the options.onSuccess and options.onError will be invoked
     * with a result object containing the following properties:
     * <br>
     * 1) 'options' object (same options passed into execute method())
     * <br>
     * 2) 'status' boolean status indicating success or error
     * <br>
     * 3) 'result' object containing command specific results
     */
    var AsyncCommand = Command.extend(
    /** @lends module:core/command~AsyncCommand.prototype */{

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

        defaultErrorMessage: 'Unexpected error, please try again.',

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
                    options: this.options,
                    result: this._argsToObject(argNames, arguments)
                };

                this.options.onSuccess.call(
                    this.options.context || this,
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
                    options: this.options,
                    result: this._argsToObject(argNames, arguments)
                };

                this.options.onError.call(
                    this.options.context || this,
                    result);
            } else {
                this.facade.trigger(notifications.ALERT, {
                    severity: 'error',
                    message: this.options.errorMessage ||
                             this.defaultErrorMessage
                });
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
     * @augments module:core/command~Command
     */
    var MacroCommand = Command.extend(
    /** @lends module:core/command~MacroCommand.prototype */{

        subCommands: [],

        /**
         * Add sub command.
         * @param {constructor} command Sub command constructor
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
