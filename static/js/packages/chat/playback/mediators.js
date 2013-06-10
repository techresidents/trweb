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
                var chat = new api.models.Chat({
                    id: notification.options.id
                });

                this.view = new playback_views.PlaybackView({
                    model: chat,
                    playerState: this.playerStateProxy.model
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
        }

    }, {

        NAME: 'PlaybackMediator',
        
        VIEW_TYPE: 'PlaybackView'
    });

    return {
        PlaybackMediator: PlaybackMediator
    };
});
