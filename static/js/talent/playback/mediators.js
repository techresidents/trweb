define([
    'underscore',
    'common/notifications',
    'core/mediator',
    'api/models',
    'talent/notifications',
    'talent/playback/views',
    'talent/player/proxies'
], function(
    _,
    notifications,
    mediator,
    api,
    talent_notifications,
    playback_views,
    player_proxies) {

    /**
     * Playback Mediator
     * @constructor
     */
    var PlaybackMediator = mediator.Mediator.extend({
        name: function() {
            return PlaybackMediator.NAME;
        },

        viewType: function() {
            return PlaybackMediator.VIEW_TYPE;
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
        },

        onCreateView: function(notification) {
            if(notification.type === this.viewType()) {
                var chatSession = new api.ChatSession({
                    id: notification.options.id
                });

                this.view = new playback_views.PlaybackView({
                    model: chatSession,
                    playerState: this.playerStateProxy.model
                });

                this.view.addEventListener(playback_views.EVENTS.PLAY, this.onPlay, this);

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

        NAME: 'PlaybackMediator',
        
        VIEW_TYPE: 'PlaybackView'
    });

    return {
        PlaybackMediator: PlaybackMediator
    };
});
