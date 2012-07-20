define([
    'common/notifications',
    'core/proxy'
], function(notifications, proxy) {

    /**
     * Chat Markers Collection Proxy
     * @constructor
     * @param {Object} options
     *   {MarkerCollection} collection
     */
    var ChatMarkersProxy = proxy.CollectionProxy.extend({

        name: function() {
            return ChatMarkersProxy.NAME;
        },
        
        /**
         * Map collection events to notifications
         */
        eventNotifications: {
            'add': notifications.MARKER_ADDED
        },

        initialize: function(options) {
        }

    }, {

        NAME: 'ChatMarkersProxy'
    });
    
    return {
        ChatMarkersProxy: ChatMarkersProxy
    };
});
