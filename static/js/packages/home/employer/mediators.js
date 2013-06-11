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
    employer_home_views) {

    /**
     * EmployerHome Mediator
     * @constructor
     */
    var EmployerHomeMediator = core.mediator.Mediator.extend({
        name: function() {
            return EmployerHomeMediator.NAME;
        },

        viewType: function() {
            return EmployerHomeMediator.VIEW_TYPE;
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

                this.view = new employer_home_views.EmployerHomeView({});

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

        NAME: 'EmployerHomeMediator',

        VIEW_TYPE: 'EmployerHomeView'
    });

    return {
        EmployerHomeMediator: EmployerHomeMediator
    };
});
