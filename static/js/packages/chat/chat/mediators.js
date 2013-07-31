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
            this.model = null;
            this.view = null;
        },

        onCreateView: function(notification) {
            if(notification.type === this.viewType()) {
                this.model = new api.models.Chat({
                    id: notification.options.id
                });
                this.facade.trigger(notifications.PARTICIPATE_IN_CHAT, {
                    model: this.model,
                    simulation: notification.options.simulation,
                    onSuccess: _.bind(this.onParticipateSuccess, this),
                    onError: _.bind(this.onParticipateError, this)
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

        onParticipateSuccess: function(result) {
            this.view = new chat_views.ChatView({
                model: this.model,
                simulation: result.options.simulation
            });

            this.facade.trigger(notifications.VIEW_CREATED, {
                type: this.viewType(),
                view: this.view
            });
        },

        onParticipateError: function(result) {
            this.view = new chat_views.ChatErrorView({
                model: this.model,
                fault: result.result.fault
            });

            this.facade.trigger(notifications.VIEW_CREATED, {
                type: this.viewType(),
                view: this.view
            });
        }

    }, {

        NAME: 'ChatMediator',
        
        VIEW_TYPE: 'ChatView'
    });

    return {
        ChatMediator: ChatMediator
    };
});
