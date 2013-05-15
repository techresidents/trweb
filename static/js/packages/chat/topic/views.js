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
     * Topic View
     * @constructor
     * @param {Object} options
     */
    var TopicView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
        },
        
        render: function() {
            return this;
        }
    });

    return {
        TopicView: TopicView
    };
});
