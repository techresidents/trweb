define([
    'common/notifications',
    'core/proxy',
], function(notifications, proxy) {


    /**
     * Chat Messages Collection Proxy.
     * @constructor
     * @param {Object} options
     *   {ChatMessageCollection} collection
     *
     * Proxy acts as the message pump for the chat by
     * long polling for new chat messages and dispatching
     * the associated notifications to trigger system actions.
     */
    var ChatMessagesProxy = proxy.CollectionProxy.extend({

        name: 'ChatMessagesProxy',
        
        /**
         * Map collection events to notifications
         */
        eventNotifications: {
            'add': notifications.MESSAGE_ADDED,
        },

        initialize: function(options) {
            
            // Message name to notification map
            this.msgNotificationMap = {
                'MARKER_CREATE': notifications.MESSAGE_MARKER_CREATE,
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
        
        /**
         * Start long polling for chat messages
         */
        longPoll: function() {
            this.collection.fetch({add: true, silent: false, complete: this.longPollCallback});
        },
        
        /**
         * New Messaege handler
         */
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
