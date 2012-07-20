define([
    'common/notifications',
    'core/proxy'
], function(notifications, proxy) {

    /**
     * Chat Resources Collection Proxy
     * @constructor
     * @param {Object} options
     *   {ResourceCollection} collection
     */
    var ChatResourcesProxy = proxy.CollectionProxy.extend({

        name: 'ChatResourcesProxy',
        
        /**
         * Map collection events to notifications
         */
        eventNotifications: {
            'add': notifications.RESOURCE_ADDED,
            'remove': notifications.RESOURCE_REMOVED
        },

        initialize: function(options) {
        }

    }, {

        NAME: 'ChatResourcesProxy'
    });
    
    return {
        ChatResourcesProxy: ChatResourcesProxy
    };
});
