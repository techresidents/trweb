define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone) {
    
    var pad2 = function(value) {
        if(value < 10) {
            return '0' + value;
        } else {
            return value.toString();
        }
    };

    var formatTimer = function(durationMs) {
        var negative = durationMs < 0;

        if(negative) {
            durationMs *= -1;
        }

        var hours = Math.floor(durationMs / 1000 / 60 / 60);
        durationMs -= (hours * 1000 * 60 * 60);
        var minutes = Math.floor(durationMs / 1000 / 60);
        durationMs -= (minutes * 1000 * 60);
        var seconds = Math.floor(durationMs / 1000);
        
        var result;
        if(hours) {
            result = pad2(hours) + ':' + pad2(minutes) + ':' + pad2(seconds);
        } else {
            result = pad2(minutes) + ':' + pad2(seconds);
        }
        
        if(negative) {
            return '-' + result;
        } else {
            return result;
        }
    };

    return {
        formatTimer: formatTimer
    };
});
