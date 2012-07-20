define([
    'common/notifications',
    'core/proxy'
], function(notifications, proxy) {

    var ChatWhiteboardsProxy = proxy.CollectionProxy.extend({

        name: function() {
            return ChatWhiteboardsProxy.NAME;
        },

        eventNotifications: {
            'add': notifications.WHITEBOARD_ADDED,
            'remove': notifications.WHITEBOARD_REMOVED
        },

        initialize: function(options) {
        }

    }, {

        NAME: 'ChatWhiteboardsProxy'
    });
    
    return {
        ChatWhiteboardsProxy: ChatWhiteboardsProxy
    };
});
