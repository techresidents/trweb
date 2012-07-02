define([
    'Underscore',
    'common/notifications',
    'core/mediator',
    'chat/user/proxies',
], function(
    _,
    notifications,
    mediator,
    user_proxies) {

    /**
     * Chat Markers Mediator
     * @constructor
     * @param {Object} options
     *
     * Mediator is responsible for mapping system notifications to chat markers.
     * This mediator does not manage a view.
     */
    var ChatMarkersMediator = mediator.Mediator.extend({
        name: 'ChatMarkersMediator',

        /**
         * Notification handlers
         */
        notifications: [
            [notifications.USER_CONNECTED_CHANGED, 'onConnectedChanged'],
            [notifications.USER_PUBLISHING_CHANGED,'onPublishingChanged'],
            [notifications.USER_SPEAKING_CHANGED,'onSpeakingChanged'],
        ],

        initialize: function(options) {
            this.usersProxy = this.facade.getProxy(user_proxies.ChatUsersProxy.NAME);

            //create JOINED_MARKER now
            var currentUser = this.usersProxy.currentUser();
            this.facade.trigger(notifications.MARKER_JOINED_CREATE, {
                userId: currentUser.id,
                name: currentUser.name(),
            });
        },

        onConnectedChanged: function(notification) {
            this.facade.trigger(notifications.MARKER_CONNECTED_CREATE, {
                userId: notification.model.id,
                isConnected: notification.model.isConnected(),
            });
        },

        onPublishingChanged: function(notification) {
            this.facade.trigger(notifications.MARKER_PUBLISHING_CREATE, {
                userId: notification.model.id,
                isPublishing: notification.model.isPublishing(),
            });
        },

        onSpeakingChanged: function(notification) {
            this.facade.trigger(notifications.MARKER_SPEAKING_CREATE, {
                userId: notification.model.id,
                isSpeaking: notification.model.isSpeaking(),
            });
        },
        
    });

    return {
        ChatMarkersMediator: ChatMarkersMediator,
    }
});
