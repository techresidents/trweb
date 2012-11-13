define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone) {
    
    /**
     * PlayerUser
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var PlayerUser = Backbone.Model.extend({
        defaults: function() {
            return {
                user: null,
                isSpeaking: false
            };
        }
    });

    /**
     * PlayerUserCollection
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var PlayerUserCollection = Backbone.Model.extend({
        model: PlayerUser
    });

    /**
     * PlayerState.
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var PlayerState = Backbone.Model.extend({

        STATE: {
            EMPTY: 'EMPTY',
            PLAYING: 'PLAYING',
            PAUSED: 'PAUSED',
            STOPPED: 'STOPPED'
        },
            
        defaults: function() {
            return {
                chatSession: null,
                chatMinute: null,
                users: new PlayerUserCollection(),
                state: this.STATE.EMPTY
            };
        },
        
        chatSession: function() {
            return this.get('chatSession');
        },

        chatMinute: function() {
            return this.get('chatMinute');
        },

        users: function() {
            return this.get('users');
        },

        state: function() {
            return this.get('state');
        }

    });

    return {
        PlayerState: PlayerState
    };
});
