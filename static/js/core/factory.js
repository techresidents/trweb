define(/** @exports core/factory */[
    'underscore',
    'core/base'
], function(
    _,
    base,
    view) {

    var Factory = base.Base.extend(
    /** @lends module:core/factory~Factory.prototype */{
        /**
         * Factory class for creating arbitrary classes.
         * @constructs
         * @augments module:core/base~Base
         * @param {constructor|object} ctorOrOptions 
         *   Class constructor or object literal with 'ctor' attribute
         * @param {object|function(options)} [options] Options to pass to ctor.
         *   options may be an options object literal or a function taking an
         *   options object literal and returning an options object literal
         *   of additional options to be passed to the ctor.
         *   <br><br>
         *   Note that additional options can be added at creation time
         *   through {@link module:core/factory~Factory#create}, but may
         *   be overriden by the factory options.
         *   <br><br>
         *   This parameter is not required if ctorOrOptions is an
         *   object literal.
         *
         * @example
         * var factory = new Factory(MyConstructor, {
         *   option1: 'hello'  
         * });
         * var instance = factory.create({
         *   options2: 'hello2'
         * });
         *
         * @example
         * var factory = new Factory({
         *   ctor: MyConstructor
         *   option1: 'hello'  
         * });
         * var instance = factory.create({
         *   options2: 'hello2'
         * });
         */
        initialize: function(ctorOrOptions, options) {
            if(arguments.length === 1) {
                this.ctor = ctorOrOptions.ctor;
                this.options = ctorOrOptions;
            } else {
                this.ctor = ctorOrOptions;
                this.options = options || {};
            }
        },
        
        /**
         * Create new instance.
         * @param {object} [options] Additional options to pass to ctor.
         * <br><br>
         * Note that the options provided may be overriden by the
         * factory options which will take precedence.
         */
        create: function(options) {
            options = options || {};
            var createOptions = _.extend(options,
                base.getValue(this, 'options', options));

            var result = new this.ctor(createOptions);
            return result;
        }
    });


    /**
     * Helper to create a new Factory class not requiring a constructor arg.
     * @param {constructor} ctor Class constructor
     * @returns {module:core/factory~Factory}
     */
    var buildFactory = function(ctor) {
        var factoryClass = Factory.extend({
            initialize: function(options) {
                Factory.prototype.initialize.call(this, ctor, options);
            }
        });
        return factoryClass;
    };

    return {
        Factory: Factory,
        buildFactory: buildFactory
    };
});
