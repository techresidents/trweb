define([
    'underscore',
    'notifications',
    'core',
    './views'
], function(
    _,
    notifications,
    core,
    chat_views) {

    /**
     * Chat Mediator
     * @constructor
     */
    var ChatMediator = core.mediator.Mediator.extend({
        name: function() {
            return ChatMediator.NAME;
        },

        viewType: function() {
            return ChatMediator.VIEW_TYPE;
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
                this.view = new chat_views.ChatView({
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

        NAME: 'ChatMediator',
        
        VIEW_TYPE: 'ChatView'
    });

    return {
        ChatMediator: ChatMediator
    };
});
