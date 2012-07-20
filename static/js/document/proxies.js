define([
    'common/notifications',
    'core/proxy'
], function(notifications, proxy) {

    /**
     * Documents Collection Proxy
     * @constructor
     * @param {Object} options
     *   {DocumentCollection} collection
     */
    var DocumentsProxy = proxy.CollectionProxy.extend({

        name: 'DocumentsProxy',

        eventNotifications: {
            'add': notifications.DOCUMENT_ADDED,
            'remove': notifications.DOCUMENT_REMOVED
        },

        initialize: function(options) {
        }

    });
    
    return {
        DocumentsProxy: DocumentsProxy
    };
});
