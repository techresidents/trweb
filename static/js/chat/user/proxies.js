define([
    'common/notifications',
    'core/proxy',
], function(notifications, proxy) {

    var ChatUsersProxy = proxy.CollectionProxy.extend({

        name: function() {
            return ChatUsersProxy.NAME;
        },

        eventNotifications: function() {
            return {
                'add': notifications.USER_ADDED,
                'change': notifications.USER_CHANGED,
                'change:isConnected': notifications.USER_CONNECTED_CHANGED,
                'change:isPublishing': notifications.USER_PUBLISHING_CHANGED,
                'remove': notifications.USER_REMOVED,
            }
        },

        initialize: function(options) {
        },
        
        currentUser: function() {
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
