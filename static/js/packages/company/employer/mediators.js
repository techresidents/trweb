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
    employer_company_views) {

    /**
     * Employer Company Mediator
     * @constructor
     */
    var EmployerCompanyMediator = core.mediator.Mediator.extend({

        name: function() {
            return EmployerCompanyMediator.NAME;
        },

        viewType: function() {
            return EmployerCompanyMediator.VIEW_TYPE;
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

                this.view = new employer_company_views.EmployerCompanyView({});

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

        NAME: 'EmployerCompanyMediator',

        VIEW_TYPE: 'EmployerCompanyView'
    });

    return {
        EmployerCompanyMediator: EmployerCompanyMediator
    };
});
