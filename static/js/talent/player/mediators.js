define([
    'underscore',
    'common/notifications',
    'core/mediator',
    'api/models',
    'talent/notifications',
    'talent/player/proxies',
    'talent/player/views'
], function(
    _,
    notifications,
    mediator,
    api,
    talent_notifications,
    player_proxies,
    player_views) {

    /**
     * Playback Mediator
     * @constructor
     */
    var PlayerMediator = mediator.Mediator.extend({
        name: function() {
            return PlayerMediator.NAME;
        },

        viewType: function() {
            return PlayerMediator.VIEW_TYPE;
        },

        /**
         * Notification handlers
         */
        notifications: [
            [notifications.VIEW_CREATE, 'onCreateView'],
            [notifications.VIEW_DESTROY, 'onDestroyView'],
            [talent_notifications.PLAYER_PLAY, 'onPlay'],
            [talent_notifications.PLAYER_PAUSE, 'onPause']
        ],

        initialize: function(options) {
            this.view = null;
            this.proxy = this.facade.getProxy(player_proxies.PlayerStateProxy.NAME);
        },

        onCreateView: function(notification) {
            if(notification.type === this.viewType()) {

                this.view = new player_views.PlayerView({
                    model: this.proxy.model
                });

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

        onPlay: function(notification) {
            this.view.play(notification.chatSession, notification.chatMinute);
        },

        onPause: function(notification) {
            this.view.pause();
        }

    }, {

        NAME: 'PlayerMediator',
        
        VIEW_TYPE: 'PlayerView'
    });

    return {
        PlayerMediator: PlayerMediator
    };
});
