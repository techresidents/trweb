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
    employer_settings_views) {

    /**
     * Employer Settings Mediator
     * @constructor
     */
    var EmployerSettingsMediator = core.mediator.Mediator.extend({
        name: function() {
            return EmployerSettingsMediator.NAME;
        },

        viewType: function() {
            return EmployerSettingsMediator.VIEW_TYPE;
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

                this.view = new employer_settings_views.EmployerSettingsAccountView({
                    model: new api.models.User({ id: 'CURRENT' })
                });

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

        NAME: 'EmployerSettingsMediator',

        VIEW_TYPE: 'EmployerSettingsView'
    });

    return {
        EmployerSettingsMediator: EmployerSettingsMediator
    };
});
