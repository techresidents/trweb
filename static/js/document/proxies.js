define([
    'common/notifications',
    'core/proxy',
], function(notifications, proxy) {

    var DocumentsProxy = proxy.CollectionProxy.extend({

        name: 'DocumentsProxy',

        eventNotifications: {
            'add': notifications.DOCUMENT_ADDED,
            'remove': notifications.DOCUMENT_REMOVED,
        },

        initialize: function(options) {
        },

    });
    
    return {
        DocumentsProxy: DocumentsProxy,
    }
});
