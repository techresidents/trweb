define([
    'underscore',
    'notifications',
    'core',
    'api',
    './views'
], function(
    _,
    notifications,
    core,
    api,
    chat_reel_views) {

    /**
     * ChatReel Mediator
     * @constructor
     */
    var ChatReelMediator = core.mediator.Mediator.extend({
        name: function() {
            return ChatReelMediator.NAME;
        },

        viewType: function() {
            return ChatReelMediator.VIEW_TYPE;
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
            if (notification.type === this.viewType()) {

                var reelCollection = new api.models.ChatReelCollection();
                this.view = new chat_reel_views.ChatReelView({
                    collection: reelCollection
                });

                this.facade.trigger(notifications.VIEW_CREATED, {
                    type: this.viewType(),
                    view: this.view,
                    options: notification.options
                });
            }
        },

        onDestroyView: function(notification) {
            if (notification.type === this.viewType()) {
                notification.view.destroy();

                this.facade.trigger(notifications.VIEW_DESTROYED, {
                    type: this.viewType(),
                    view: notification.view
                });
                if (this.view === notification.view) {
                    this.view = null;
                }
            }
        }

    }, {

        NAME: 'ChatReelMediator',

        VIEW_TYPE: 'ChatReelView'
    });

    return {
        ChatReelMediator: ChatReelMediator
    };
});
