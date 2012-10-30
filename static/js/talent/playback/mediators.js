define([
    'underscore',
    'common/notifications',
    'core/mediator',
    'api/models',
    'talent/playback/views'
], function(
    _,
    notifications,
    mediator,
    api,
    playback_views) {

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
        },

        onCreateView: function(notification) {
            if(notification.type === this.viewType()) {
                var chatSession = new api.ChatSession({
                    id: notification.options.id
                });

                this.view = new playback_views.PlaybackView({
                    model: chatSession,
                    load: true
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
