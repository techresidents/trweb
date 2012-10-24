define([
    'Underscore',
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

        /**
         * Notification handlers
         */
        notifications: [
            [notifications.VIEW_CREATE, 'onCreateView'],
            [notifications.VIEW_DESTROY, 'onDestroyView']
        ],

        initialize: function(options) {
            this.view = null;
            this.user = null;
        },

        onCreateView: function(notification) {
            if(notification.type === UserMediator.VIEW_TYPE) {
                this.user = new api.User({
                    id: notification.options.id
                });
                this.view = new user_views.UserView({
                    model: this.user
                });
                this.user.fetch();

                this.facade.trigger(notifications.VIEW_CREATED, {
                    type: UserMediator.VIEW_TYPE,
                    view: this.view,
                    options: notification.options
                });
            }
        },

        onDestroyView: function(notification) {
            if(notification.type === UserMediator.VIEW_TYPE) {
                notification.view.destroy();

                this.facade.trigger(notifications.VIEW_DESTROYED, {
                    type: UserMediator.VIEW_TYPE,
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
