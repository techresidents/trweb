define([
    'common/notifications',
    'core/proxy',
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
            'change:endTimestamp': notifications.MINUTE_ENDED,
        },

        initialize: function(options) {
        },
        
        /**
         * Return currently active minute.
         */
        active: function() {
            return this.collection.active();
        },

    }, {

        NAME: 'ChatMinutesProxy',
    });
    
    return {
        ChatMinutesProxy: ChatMinutesProxy,
    }
});
