define([
    'common/notifications',
    'core/proxy',
], function(notifications, proxy) {

    var ChatResourcesProxy = proxy.CollectionProxy.extend({

        name: 'ChatResourcesProxy',

        eventNotifications: {
            'add': notifications.RESOURCE_ADDED,
            'remove': notifications.RESOURCE_REMOVED,
        },

        initialize: function(options) {
        },

    }, {

        NAME: 'ChatResourcesProxy',
    });
    
    return {
        ChatResourcesProxy: ChatResourcesProxy,
    }
});
