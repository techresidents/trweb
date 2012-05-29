define([
    'core/proxy',
], function(proxy) {

    var DocumentsProxy = proxy.CollectionProxy.extend({

        name: 'DocumentsProxy',

        eventNotifications: {
            'add': 'Documents:add',
            'remove': 'Documents:remove',
        },

        initialize: function(options) {
        },

    });
    
    return {
        DocumentsProxy: DocumentsProxy,
    }
});
