define([
    'common/notifications',
    'core/proxy',
], function(notifications, proxy) {

    /**
     * Chat Tags Collection Proxy
     * @constructor
     * @param {Object} options
     *   {TagCollection} collection
     */
    var ChatTagsProxy = proxy.CollectionProxy.extend({

        name: function() {
            return ChatTagsProxy.NAME;
        },
    
        /**
         * Map collection events to notifications
         */
        eventNotifications: {
            'add': notifications.TAG_ADDED,
            'remove': notifications.TAG_REMOVED,
        },

        initialize: function(options) {
        },

    }, {

        NAME: 'ChatTagsProxy'
    });
    
    return {
        ChatTagsProxy: ChatTagsProxy,
    }
});
