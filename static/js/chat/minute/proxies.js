define([
    'common/notifications',
    'core/proxy'
], function(notifications, proxy) {

    /**
     * Chat Minutes Collection Proxy
     * @constructor
     * @param {Object} options
     *   {MinuteCollection} collection
     */
    var ChatMinutesProxy = proxy.CollectionProxy.extend({

        name: function() {
            return ChatMinutesProxy.NAME;
        },
    
        /**
         * Map collection events to notifications
         */
        eventNotifications: {
            'add': notifications.MINUTE_STARTED,
            'change:endTimestamp': notifications.MINUTE_ENDED
        },

        initialize: function(options) {
        }
        
    }, {

        NAME: 'ChatMinutesProxy'
    });
    
    return {
        ChatMinutesProxy: ChatMinutesProxy
    };
});
