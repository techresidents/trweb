define([
    'underscore',
    'common/notifications',
    'core/mediator',
    'api/models',
    'talent/notifications',
    'talent/player/models',
    'talent/player/views'
], function(
    _,
    notifications,
    mediator,
    api,
    talent_notifications,
    player_models,
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
            [talent_notifications.PLAYER_PLAY, 'onPlay']
        ],

        initialize: function(options) {
            this.view = null;
        },

        onCreateView: function(notification) {
            if(notification.type === this.viewType()) {

                this.view = new player_views.PlayerView({
                    model: new player_models.NowPlaying()
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
            var model = this.view.model;
            if(model.chatSession() !== notification.chatSession ||
               model.chatMinute() !== notification.chatMinute) {
                this.view.model.set({
                    chatSession: notification.chatSession,
                    chatMinute: notification.chatMinute
                });
            }else {
                this.view.play();
            }
        }

    }, {

        NAME: 'PlayerMediator',
        
        VIEW_TYPE: 'PlayerView'
    });

    return {
        PlayerMediator: PlayerMediator
    };
});
