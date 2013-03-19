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
         * @param {object} [options] Options to pass to ctor.
         *   Note that additional options can be added at creation time
         *   through {@link module:core/factory~Factory#create}
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
         * @param {object|function} [options] Additional options to  pass to ctor.
         *   An object or a function which returns an options object. 
         *   Note that these options override any options passed
         *   in through the constructor.
         */
        create: function(options, optionsFunctionArg) {
            var createOptions = _.extend({},
                base.getValue(this, 'options', optionsFunctionArg),
                options);

            var result = new this.ctor(createOptions);
            return result;
        },

        /**
         * Extend options object literal that will be passed to the
         * constructor.
         * @param {object|function} options
         *   An object or a function which returns an options object.
         *   Note that these options override any options passed
         *   in through the constructor.
         */
        extendOptions: function(options) {
            var currentOptions = {options: this.options};
            var newOptions = {options: options};
            this.options = function(optionsFunctionArg) {
                var result = _.extend(
                        base.getValue(currentOptions, 'options', optionsFunctionArg),
                        base.getValue(newOptions, 'options', optionsFunctionArg));
                return result;
            };
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
