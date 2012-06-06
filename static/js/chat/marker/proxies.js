define([
    'common/notifications',
    'core/proxy',
], function(notifications, proxy) {

    var ChatMarkersProxy = proxy.CollectionProxy.extend({

        name: function() {
            return ChatMarkersProxy.NAME;
        },

        eventNotifications: {
            'add': notifications.MARKER_ADDED,
        },

        initialize: function(options) {
        },

    }, {

        NAME: 'ChatMarkersProxy',
    });
    
    return {
        ChatMarkersProxy: ChatMarkersProxy,
    }
});
