define([
    'core/proxy',
], function(proxy) {

    var ChatUsersProxy = proxy.CollectionProxy.extend({

        name: function() {
            return ChatUsersProxy.NAME;
        },

        eventNotifications: function() {
            return {
                'add': ChatUsersProxy.USER_ADDED,
                'change': ChatUsersProxy.USER_CHANGED,
                'change:isConnected': ChatUsersProxy.USER_CONNECTED,
                'change:isPublishing': ChatUsersProxy.USER_PUBLISHING,
                'remove': ChatUsersProxy.USER_REMOVED,
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
        
        /* NOTIFICATIONS */
        USER_ADDED: 'ChatUsers:userAdded',
        USER_CHANGED: 'ChatUsers:userChanged',
        USER_CONNECTED: 'ChatUsers:userConnected',
        USER_PUBLISHING: 'ChatUsers:userPublishing',
        USER_REMOVED: 'ChatUsers:userRemoved',
    });
    
    return {
        ChatUsersProxy: ChatUsersProxy,
    }
});
