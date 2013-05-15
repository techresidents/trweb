define(/** @exports core/base */[
    'jquery',
    'underscore'
], function($, _) {

    /**
     * Inherit from parent constructor while adding the specified prototypeProperties and staticProperties.
     *
     * @param {function} parent contructor from which to inherit.
     * @param {object} prototypeProperties properties to add object prototype
     * @param {object} staticProperties properties to add to class (function)
     *
     * @returns {function} Constructor to create a new object with the specified
     * inheritance chain.
     */
    var inherits = function(parent, prototypeProperties, staticProperties) {
        var tempCtor = function(){};

        var child;
        if(prototypeProperties && prototypeProperties.hasOwnProperty('constructor')) {
            child = prototypeProperties.constructor;
        } else {
            child = function() {
                parent.apply(this, arguments);
            };
        }
        
        //inherit static properties from parent
        _.extend(child, parent);

        //create prototype chain
        tempCtor.prototype = parent.prototype;
        child.prototype = new tempCtor();

        //add prototype properties to prototype
        if(prototypeProperties) {
            _.extend(child.prototype, prototypeProperties);
        }

        //add static properties
        if(staticProperties) {
            _.extend(child, staticProperties);
        }

        //set child constructor
        child.prototype.constructor = child;

        //convenience __super__ property
        child.__super__ = parent.prototype;

        return child;
    };

    
    /**
     * Propagating extend method intended to be added to a constructor to make
     * inheritance easy. See Base for an example.
     * @param {object} prototypeProperties Prototype properties
     * @param {object} staticProperties Static properties
     *
     * @returns {function} constructor to object with specified inheritance
     */
    var extend = function(prototypeProperties, staticProperties) {

        //this should be the parent constructor
        //if extend has been added to parent constructor prior to invocation
        var child = inherits(this, prototypeProperties, staticProperties);

        //add extend method to child constructor
        child.extend = extend;
        return child;
    };


    /**
     * Get the value of property from object, regardless if
     * it's a property or method.
     *
     * @param {object} object Object instance
     * @param {string} property Property name
     * @param {object} [arg] argument to pass to function if property is function
     *
     * @returns {object}  object[property] if object[property] is not a function,
     *         object[property]() otherwise.
     */
    var getValue = function(object, property, arg) {
        var result = null;
        
        if(object && !_.isUndefined(object[property])) {
            if(_.isFunction(object[property])) {
                result = object[property](arg);
            } else {
                result = object[property];
            }
        }
        return result;
    };

    /**
     * Base class with propagating extend method.
     * Constructor will invoke initialize method with
     * all arguments.
     * @constructor
     */
    var Base = function() {
        this.initialize.apply(this, arguments);
    };
    Base.extend = extend;

    _.extend(Base.prototype, {
        
        initialize: function() {}
    });

    return {
        extend: extend,
        getValue: getValue,
        inherits: inherits,
        Base: Base
    };

});
