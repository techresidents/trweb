define([
    'common/notifications',
    'core/proxy',
], function(notifications, proxy) {

    /**
     * Chat Users Collection Proxy
     * @constructor
     * @param {Object} options
     *   {ChatUserCollection} collection
     */
    var ChatUsersProxy = proxy.CollectionProxy.extend({

        name: function() {
            return ChatUsersProxy.NAME;
        },
        
        /**
         * Map collection events to notifications
         */
        eventNotifications: function() {
            return {
                'add': notifications.USER_ADDED,
                'change': notifications.USER_CHANGED,
                'change:isConnected': notifications.USER_CONNECTED_CHANGED,
                'change:isPublishing': notifications.USER_PUBLISHING_CHANGED,
                'change:isSpeaking': notifications.USER_SPEAKING_CHANGED,
                'remove': notifications.USER_REMOVED,
            }
        },

        initialize: function(options) {
        },
        
        /**
         * Return the current user.
         * @return {User}
         */
        currentUser: function() {
            //current user is always first
            return this.collection.first();
        },

    }, {
        /* NAME */
        NAME: 'ChatUsersProxy',
    });
    
    return {
        ChatUsersProxy: ChatUsersProxy,
    }
});
