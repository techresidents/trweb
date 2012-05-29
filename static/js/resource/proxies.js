define([
    'core/proxy',
], function(proxy) {

    var ResourcesProxy = proxy.CollectionProxy.extend({

        name: 'ResourcesProxy',

        eventNotifications: {
            'add': 'Resources:add',
            'remove': 'Resources:remove',
        },

        initialize: function(options) {
        },

    });
    
    return {
        ResourcesProxy: ResourcesProxy,
    }
});
