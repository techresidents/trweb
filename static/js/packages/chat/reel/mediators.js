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
    highlight_reel_views) {

    /**
     * HighlightReel Mediator
     * @constructor
     */
    var HighlightReelMediator = core.mediator.Mediator.extend({
        name: function() {
            return HighlightReelMediator.NAME;
        },

        viewType: function() {
            return HighlightReelMediator.VIEW_TYPE;
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
                this.view = new highlight_reel_views.HighlightReelView({
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

        NAME: 'HighlightReelMediator',

        VIEW_TYPE: 'HighlightReelView'
    });

    return {
        HighlightReelMediator: HighlightReelMediator
    };
});
