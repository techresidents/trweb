define([
    'jQuery',
    'Underscore',
    'Backbone',
    'raphael',
], function($, _, Backbone, Raphael) {

    /**
     * Whiteboard element serializer.
     * @constructor
     */
    var Serializer = function() {
    };

    Serializer.prototype.serializeElement = function(element) {
        result = { type: element.type};
        _.extend(result, element.attrs);

        return JSON.stringify([result]);
    };

    Serializer.prototype.deserializeElement = function(element) {
        return JSON.parse(element);
    };

    return {
        Serializer: Serializer
    }

});
