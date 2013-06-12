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
    developer_home_views) {

    /**
     * DeveloperHome Mediator
     * @constructor
     */
    var DeveloperHomeMediator = core.mediator.Mediator.extend({
        name: function() {
            return DeveloperHomeMediator.NAME;
        },

        viewType: function() {
            return DeveloperHomeMediator.VIEW_TYPE;
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

                this.view = new developer_home_views.DeveloperHomeView({});

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

        NAME: 'DeveloperHomeMediator',

        VIEW_TYPE: 'DeveloperHomeView'
    });

    return {
        DeveloperHomeMediator: DeveloperHomeMediator
    };
});
