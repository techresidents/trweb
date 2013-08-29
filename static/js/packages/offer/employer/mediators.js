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
    employer_offers_views) {

    /**
     * Employer Offers Mediator
     * @constructor
     */
    var EmployerOffersMediator = core.mediator.Mediator.extend({
        name: function() {
            return EmployerOffersMediator.NAME;
        },

        viewType: function() {
            return EmployerOffersMediator.VIEW_TYPE;
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

                this.view = new employer_offers_views.EmployerOffersView({});

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

        NAME: 'EmployerOffersMediator',

        VIEW_TYPE: 'EmployerOffersView'
    });

    return {
        EmployerOffersMediator: EmployerOffersMediator
    };
});
