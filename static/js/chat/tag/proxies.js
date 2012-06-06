define([
    'common/notifications',
    'core/proxy',
], function(notifications, proxy) {

    var ChatTagsProxy = proxy.CollectionProxy.extend({

        name: function() {
            return ChatTagsProxy.NAME;
        },

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
