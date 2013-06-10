define([
    'underscore',
    'notifications',
    'core',
    'api',
    'ctrl',
    './views'
], function(
    _,
    notifications,
    core,
    api,
    ctrl,
    playback_views) {

    /**
     * Playback Mediator
     * @constructor
     */
    var PlaybackMediator = core.mediator.Mediator.extend({
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
                ctrl.proxies.player.PlayerStateProxy.NAME);
        },

        onCreateView: function(notification) {
            if(notification.type === this.viewType()) {
                var chatSession = new api.models.ChatSession({
                    id: notification.options.id
                });

                this.view = new playback_views.PlaybackView({
                    model: chatSession,
                    playerState: this.playerStateProxy.model
                });

                this.view.addEventListener(this.cid, playback_views.EVENTS.PLAY, this.onPlay, this);
                this.view.addEventListener(this.cid, playback_views.EVENTS.PAUSE, this.onPause, this);

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
            this.facade.trigger(notifications.PLAYER_PLAY, notificationBody);
        },

        onPause: function(e, eventBody) {
            this.facade.trigger(notifications.PLAYER_PAUSE);
        }

    }, {

        NAME: 'PlaybackMediator',
        
        VIEW_TYPE: 'PlaybackView'
    });

    return {
        PlaybackMediator: PlaybackMediator
    };
});
