define([
    'common/notifications',
    'core/proxy',
], function(notifications, proxy) {

    var ChatMessagesProxy = proxy.CollectionProxy.extend({

        name: 'ChatMessagesProxy',

        eventNotifications: {
            'add': 'ChatMessages:add',
        },

        initialize: function(options) {

            this.msgNotificationMap = {
                'MINUTE_CREATE': notifications.MESSAGE_MINUTE_CREATE,
                'MINUTE_UPDATE': notifications.MESSAGE_MINUTE_UPDATE,
                'TAG_CREATE': notifications.MESSAGE_TAG_CREATE,
                'TAG_DELETE': notifications.MESSAGE_TAG_DELETE,
                'WHITEBOARD_CREATE': notifications.MESSAGE_WHITEBOARD_CREATE,
                'WHITEBOARD_DELETE': notifications.MESSAGE_WHITEBOARD_DELETE,
                'WHITEBOARD_CREATE_PATH': notifications.MESSAGE_WHITEBOARD_CREATE_PATH,
                'WHITEBOARD_DELETE_PATH': notifications.MESSAGE_WHITEBOARD_DELETE_PATH,
            };

            this.longPollErrorDelayMs = 10000 || options.longPollErrorDelayMs;

            //define long poll callback outside of longPoll function
            //to cut down on memory usage since this function is
            //call frequently.
            var that=this;
            this.longPollCallback = function(success, response) {
                if(success) {
                    that.longPoll.call(that);
                } else {
                    setTimeout(function() {
                        that.longPoll.call(that);
                    }, that.longPollErrorDelayMs);
                }
            };

            this.collection.on('add', this.onMessageAdded, this);
        },

        longPoll: function() {
            this.collection.fetch({add: true, silent: false, complete: this.longPollCallback});
        },

        onMessageAdded: function(chatMessageModel) {
            var notificationName = this.msgNotificationMap[chatMessageModel.msgType()];
            this.facade.trigger(notificationName, {
                model: chatMessageModel
            });
        }
    });
    
    return {
        ChatMessagesProxy: ChatMessagesProxy,
    }
});
