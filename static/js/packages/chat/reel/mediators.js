define([
    'underscore',
    'notifications',
    'core',
    'api',
    'ui',
    './views'
], function(
    _,
    notifications,
    core,
    api,
    ui,
    highlight_reel_views) {

    /**
     * HighlightReel Mediator
     * @constructor
     */
    var HighlightReelMediator = core.mediator.Mediator.extend({

        name: function() {
            return HighlightReelMediator.NAME;
        },

        isViewType: function(type) {
            return _.contains(HighlightReelMediator.VIEW_TYPE, type);
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
            if (this.isViewType(notification.type)) {

                switch(notification.type) {

                    case HighlightReelMediator.VIEW_TYPE.HIGHLIGHT_REEL:
                        var reelCollection = new api.models.ChatReelCollection();
                        this.view = new highlight_reel_views.HighlightReelView({
                            collection: reelCollection
                        });
                        break;

                    case HighlightReelMediator.VIEW_TYPE.CHAT_REEL_SELECTOR:
                        this.view = this.createChatReelSelectorView(notification.options);
                        break;
                }

                this.facade.trigger(notifications.VIEW_CREATED, {
                    type: notification.type,
                    view: this.view,
                    options: notification.options
                });
            }
        },

        onDestroyView: function(notification) {
            if (this.isViewType(notification.type)) {
                notification.view.destroy();

                this.facade.trigger(notifications.VIEW_DESTROYED, {
                    type: notification.type,
                    view: notification.view
                });
                if (this.view === notification.view) {
                    this.view = null;
                }
            }
        },

        createChatReelSelectorView: function(options) {
            var modalOptions = {
                title: 'Add To Your Highlight Reel',
                viewOrFactory: new highlight_reel_views.AddReelModalView({
                    chatReelCollection: options.chatReelCollection
                })
            };
            var modalView = new ui.modal.views.ModalView(modalOptions);
            return modalView;
        }
    }, {

        NAME: 'HighlightReelMediator',

        VIEW_TYPE: {
            HIGHLIGHT_REEL: 'HighlightReel',
            CHAT_REEL_SELECTOR: 'ChatReelSelector'
        }
    });

    return {
        HighlightReelMediator: HighlightReelMediator
    };
});
