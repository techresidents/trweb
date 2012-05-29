define([
    'core/proxy',
], function(proxy) {

    var ChatMinutesProxy = proxy.CollectionProxy.extend({

        name: function() {
            return ChatMinutesProxy.NAME;
        },

        eventNotifications: {
            'add': 'ChatMinutes:add',
            'change': 'ChatMinutes:change',
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
