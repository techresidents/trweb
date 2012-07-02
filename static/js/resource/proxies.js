define([
    'core/proxy',
], function(proxy) {

    /**
     * Resources Collection Proxy
     * @constructor
     * @param {Object} options
     *   {ResourceCollection} collection
     */
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
