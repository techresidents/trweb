define([
    'core/proxy',
], function(proxy) {

    var ChatResourcesProxy = proxy.CollectionProxy.extend({

        name: 'ChatResourcesProxy',

        eventNotifications: {
            'add': 'ChatResources:add',
            'remove': 'ChatResources:remove',
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
