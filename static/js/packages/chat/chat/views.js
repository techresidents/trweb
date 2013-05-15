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
     * Chat View
     * @constructor
     * @param {Object} options
     */
    var ChatView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
        },
        
        render: function() {
            return this;
        }
    });

    return {
        ChatView: ChatView
    };
});
