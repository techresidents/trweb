define([
    'underscore',
    'common/notifications',
    'core/mediator',
    'api/models',
    'talent/user/views'
], function(
    _,
    notifications,
    mediator,
    api,
    user_views) {

    /**
     * User Mediator
     * @constructor
     */
    var UserMediator = mediator.Mediator.extend({
        name: function() {
            return UserMediator.NAME;
        },

        viewType: function() {
            return UserMediator.VIEW_TYPE;
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
                var user = new api.User({
                    id: notification.options.id
                });
                this.view = new user_views.UserView({
                    model: user,
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

        NAME: 'UserMediator',
        
        VIEW_TYPE: 'UserView'
    });

    return {
        UserMediator: UserMediator
    };
});
