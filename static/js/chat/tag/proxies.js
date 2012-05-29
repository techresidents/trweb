define([
    'core/proxy',
], function(proxy) {

    var ChatTagsProxy = proxy.CollectionProxy.extend({

        name: function() {
            return ChatTagsProxy.NAME;
        },

        eventNotifications: {
            'add': 'ChatTags:add',
            'remove': 'ChatTags:remove',
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
