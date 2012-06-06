define([
    'common/notifications',
    'core/proxy',
], function(notifications, proxy) {

    var ChatMinutesProxy = proxy.CollectionProxy.extend({

        name: function() {
            return ChatMinutesProxy.NAME;
        },

        eventNotifications: {
            'add': notifications.MINUTE_STARTED,
            'change:endTimestamp': notifications.MINUTE_ENDED,
        },

        initialize: function(options) {
        },

    }, {

        NAME: 'ChatMinutesProxy',
    });
    
    return {
        ChatMinutesProxy: ChatMinutesProxy,
    }
});
