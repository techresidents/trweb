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
            
        defaults: function() {
            return {
                chatSession: null,
                chatMinute: null,
                users: new PlayerUserCollection()
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
        }

    });

    return {
        PlayerState: PlayerState
    };
});
