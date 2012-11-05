define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone) {
    
    /**
     * Now playing model.
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var NowPlaying = Backbone.Model.extend({
            
        defaults: function() {
            return {
                chatSession: null,
                chatMinute: null
            };
        },
        
        chatSession: function() {
            return this.get('chatSession');
        },

        chatMinute: function() {
            return this.get('chatMinute');
        }

    });

    return {
        NowPlaying: NowPlaying
    };
});
