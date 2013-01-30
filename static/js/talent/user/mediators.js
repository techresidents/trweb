define([
    'underscore',
    'common/notifications',
    'core/mediator',
    'api/models',
    'api/session',
    'talent/notifications',
    'talent/user/views',
    'talent/player/proxies'
], function(
    _,
    notifications,
    mediator,
    api,
    api_session,
    talent_notifications,
    user_views,
    player_proxies) {

    /**
     * User Mediator
     * @constructor
     */
    var UserMediator = mediator.Mediator.extend({
        name: function() {
            return UserMediator.NAME;
        },

        viewType: function() {
            return UserMediator.VIEW_TYPE;
        },

        /**
         * Notification handlers
         */
        notifications: [
            [notifications.VIEW_CREATE, 'onCreateView'],
            [notifications.VIEW_DESTROY, 'onDestroyView']
        ],

        initialize: function(options) {
            this.view = null;
            this.playerStateProxy = this.facade.getProxy(
                player_proxies.PlayerStateProxy.NAME);
            this.session = new api_session.ApiSession.get();
        },

        onCreateView: function(notification) {
            if(notification.type === this.viewType()) {

                var user = this.session.getModel(api.User, notification.options.id);

                this.view = new user_views.UserView({
                    model: user,
                    playerState: this.playerStateProxy.model
                });

                this.view.addEventListener(user_views.EVENTS.PLAY_CHAT, this.onPlay, this);

                this.facade.trigger(notifications.VIEW_CREATED, {
                    type: this.viewType(),
                    view: this.view,
                    options: notification.options
                });
            }
        },

        onDestroyView: function(notification) {
            if(notification.type === this.viewType()) {
                notification.view.destroy();

                this.facade.trigger(notifications.VIEW_DESTROYED, {
                    type: this.viewType(),
                    view: notification.view
                });
                if(this.view === notification.view) {
                    this.view = null;
                }
            }
        },

        onPlay: function(e, eventBody) {
            var notificationBody = {
                chatSession: eventBody.chatSession,
                chatMinute: eventBody.chatMinute
            };
            this.facade.trigger(talent_notifications.PLAYER_PLAY, notificationBody);
        }

    }, {

        NAME: 'UserMediator',
        
        VIEW_TYPE: 'UserView'
    });

    return {
        UserMediator: UserMediator
    };
});
