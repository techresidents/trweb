define([
    'underscore',
    'notifications',
    'core',
    'ctrl',
    './views'
], function(
    _,
    notifications,
    core,
    ctrl,
    player_views) {

    /**
     * Playback Mediator
     * @constructor
     */
    var PlayerMediator = core.mediator.Mediator.extend({
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
            [notifications.PLAYER_PLAY, 'onPlay'],
            [notifications.PLAYER_PAUSE, 'onPause']
        ],

        initialize: function(options) {
            this.view = null;
            this.proxy = null;
        },

        onCreateView: function(notification) {
            if(notification.type === this.viewType()) {

                this.proxy = this.facade.getProxy(
                    ctrl.proxies.player.PlayerStateProxy.NAME);

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
