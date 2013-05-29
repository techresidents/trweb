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
    chat_reel_views) {

    /**
     * ChatReel Mediator
     * @constructor
     */
    var ChatReelMediator = core.mediator.Mediator.extend({

        name: function() {
            return ChatReelMediator.NAME;
        },

        isViewType: function(type) {
            return _.contains(ChatReelMediator.VIEW_TYPE, type);
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

                    case ChatReelMediator.VIEW_TYPE.CHAT_REEL:
                        var reelCollection = new api.models.ChatReelCollection();
                        this.view = new chat_reel_views.ChatReelView({
                            collection: reelCollection
                        });
                        break;

                    case ChatReelMediator.VIEW_TYPE.CHAT_REEL_SELECTOR:
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
                viewOrFactory: new chat_reel_views.AddChatModalView({
                    chatReelCollection: options.chatReelCollection
                })
            };
            var modalView = new ui.modal.views.ModalView(modalOptions);
            return modalView;
        }
    }, {

        NAME: 'ChatReelMediator',

        VIEW_TYPE: {
            CHAT_REEL: 'ChatReel',
            CHAT_REEL_SELECTOR: 'ChatReelSelector'
        }
    });

    return {
        ChatReelMediator: ChatReelMediator
    };
});
