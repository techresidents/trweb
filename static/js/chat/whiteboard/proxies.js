define([
    'core/proxy',
], function(proxy) {

    var ChatWhiteboardsProxy = proxy.CollectionProxy.extend({

        name: function() {
            return ChatWhiteboardsProxy.NAME;
        },

        eventNotifications: {
            'add': 'ChatWhiteboards:add',
            'remove': 'ChatWhiteboards:remove',
        },

        initialize: function(options) {
        },

    }, {

        NAME: 'ChatWhiteboardsProxy'
    });
    
    return {
        ChatWhiteboardsProxy: ChatWhiteboardsProxy,
    }
});
