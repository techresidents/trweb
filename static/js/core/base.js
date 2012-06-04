define([
    'jQuery',
    'Underscore',
], function($, _) {
    
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


    var extend = function(prototypeProperties, staticProperties) {
        var child = inherits(this, prototypeProperties, staticProperties);
        child.extend = extend;
        return child;
    };


    var getValue = function(object, property) {
        var result = null;
        if(object && object[property]) {
            result = _.isFunction(object[property]) ? object[property]() : object[property];
        }
        return result;
    }


    var Base = function() {
        this.initialize.apply(this, arguments);
    };
    Base.extend = extend;

    _.extend(Base.prototype, {

        initialize: function() {},
    });

    return {
        extend: extend,
        getValue: getValue,
        inherits: inherits,
        Base: Base,
    };

});
