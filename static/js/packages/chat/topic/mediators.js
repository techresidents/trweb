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
    topic_views) {

    /**
     * Topic Mediator
     * @constructor
     */
    var TopicMediator = core.mediator.Mediator.extend({
        name: function() {
            return TopicMediator.NAME;
        },

        viewType: function() {
            return TopicMediator.VIEW_TYPE;
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

                var topic = new api.models.Topic({
                    id: notification.options.id
                });

                this.view = new topic_views.TopicRegistrationView({
                    model: topic
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

        NAME: 'TopicMediator',
        
        VIEW_TYPE: 'TopicView'
    });

    return {
        TopicMediator: TopicMediator
    };
});
