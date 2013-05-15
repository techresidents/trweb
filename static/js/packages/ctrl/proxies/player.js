define([
    'notifications',
    'core/proxy'
], function(notifications, proxy) {

    /**
     * Player State Model Proxy
     * @constructor
     * @param {Object} options
     *   model: {PlayerState} model
     */
    var PlayerStateProxy = proxy.ModelProxy.extend({

        name: function() {
            return PlayerStateProxy.NAME;
        },
    
        /**
         * Map collection events to notifications
         */
        eventNotifications: {
            'change': notifications.PLAYER_STATE_CHANGED
        },

        initialize: function(options) {
        },
        
        /**
         * Return currently active minute.
         */
        active: function() {
            return this.collection.active();
        }

    }, {

        NAME: 'PlayerStateProxy'
    });
    
    return {
        PlayerStateProxy: PlayerStateProxy
    };
});
