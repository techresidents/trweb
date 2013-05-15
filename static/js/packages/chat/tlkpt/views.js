define([
    'jquery',
    'underscore',
    'backbone',
    'core'
], function(
    $,
    _,
    Backbone,
    core) {

    /**
     * Talking Point View
     * @constructor
     * @param {Object} options
     */
    var TalkingPointView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
        },
        
        render: function() {
            return this;
        }
    });

    return {
        TalkingPointView: TalkingPointView
    };
});
