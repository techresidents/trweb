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

        isViewType: function(type) {
            return _.contains(PlayerMediator.VIEW_TYPE, type);
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

        createPlayerView: function(options) {
            return new player_views.PlayerView({
                model: this.proxy.model
            });
        },

        createEmployerPlayerView: function(options) {
            return new player_views.EmployerPlayerView({
                model: this.proxy.model
            });
        },

        onCreateView: function(notification) {
            if(!this.isViewType(notification.type)) {
                return;
            }

            if(this.proxy === null) {
                this.proxy = this.facade.getProxy(
                    ctrl.proxies.player.PlayerStateProxy.NAME);
            }

            switch(notification.type) {
                case PlayerMediator.VIEW_TYPE.PLAYER:
                    this.view = this.createPlayerView(notification.options);
                    break;
                case PlayerMediator.VIEW_TYPE.EMPLOYER:
                    this.view = this.createEmployerPlayerView(notification.options);
                    break;
            }

            this.facade.trigger(notifications.VIEW_CREATED, {
                type: notification.type,
                view: this.view,
                options: notification.options
            });
        },

        onDestroyView: function(notification) {
            if(this.isViewType(notification.type)) {
                notification.view.destroy();

                this.facade.trigger(notifications.VIEW_DESTROYED, {
                    type: notification.type,
                    view: notification.view
                });

                if(this.view === notification.view) {
                    this.view = null;
                }
            }
        },

        onPlay: function(notification) {
            this.view.play(notification.chat);
        },

        onPause: function(notification) {
            this.view.pause();
        }

    }, {

        NAME: 'PlayerMediator',

        VIEW_TYPE: {
            PLAYER: 'PlayerView',
            EMPLOYER: 'EmployerPlayerView'
        }
    });

    return {
        PlayerMediator: PlayerMediator
    };
});
