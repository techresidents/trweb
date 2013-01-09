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
        },

        user: function() {
            return this.get('user');
        },

        isSpeaking: function() {
            return this.get('isSpeaking');
        },
        
        toJSON: function(options) {
            return {
                user: this.user().toJSON(options),
                isSpeaking: this.isSpeaking()
            };
        }
    });

    /**
     * PlayerUserCollection
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var PlayerUserCollection = Backbone.Collection.extend({
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
                archive: null,
                duration: 0,
                offset: 0,
                buffered: 0,
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

        archive: function() {
            return this.get('archive');
        },

        duration: function() {
            return this.get('duration');
        },

        offset: function() {
            return this.get('offset');
        },

        buffered: function() {
            return this.get('buffered');
        },

        users: function() {
            return this.get('users');
        },

        state: function() {
            return this.get('state');
        },

        isEmpty: function() {
            return this.state() === this.STATE.EMPTY;
        },

        isPlaying: function() {
            return this.state() === this.STATE.PLAYING;
        },

        isPaused: function() {
            return this.state() === this.STATE.PAUSED;
        },

        isStopped: function() {
            return this.state() === this.STATE.STOPPED;
        }

    });

    return {
        PlayerState: PlayerState,
        PlayerUser: PlayerUser,
        PlayerUserCollection: PlayerUserCollection
    };
});
