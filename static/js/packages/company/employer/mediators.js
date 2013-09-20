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

    var CompanyProfileMediator = core.mediator.Mediator.extend({

        name: function() {
            return CompanyProfileMediator.NAME;
        },

        isViewType: function(type) {
            return _.contains(CompanyProfileMediator.VIEW_TYPE, type);
        },

        /**
         * Notification handlers
         */
        notifications: [
            [notifications.VIEW_CREATE, 'onCreateView'],
            [notifications.VIEW_DESTROY, 'onDestroyView']
        ],

        /**
         * Employer Company Profile Mediator
         * @constructor
         * @classdesc
         * Mediator responsible for read/edit employer company profile views
         */
        initialize: function(options) {
            this.view = null;
        },

        createCompanyProfileView: function() {
            var userModel = new api.models.User({ id: 'CURRENT' });
            this.view = new employer_company_views.CompanyProfileView({
                model: userModel.get_tenant()
            });
        },

        createCompanyProfileEditView: function() {
            var userModel = new api.models.User({ id: 'CURRENT' });
            this.view = new employer_company_views.CompanyProfileEditView({
                model: userModel.get_tenant()
            });
        },

        onCreateView: function(notification) {
            if (this.isViewType(notification.type)) {

                switch(notification.type) {
                    case CompanyProfileMediator.VIEW_TYPE.READ:
                        this.createCompanyProfileView();
                        break;
                    case CompanyProfileMediator.VIEW_TYPE.EDIT:
                        this.createCompanyProfileEditView();
                        break;
                }

                this.facade.trigger(notifications.VIEW_CREATED, {
                    type: notification.type,
                    view: this.view,
                    options: notification.options
                });
            }
        },

        onDestroyView: function(notification) {
            if (this.isViewType(notification.type)) {
                notification.view.destroy();
                this.facade.trigger(notifications.VIEW_DESTROYED, {
                    type: notification.type,
                    view: notification.view
                });
                if (this.view === notification.view) {
                    this.view = null;
                }
            }
        }

    }, {

        NAME: 'EmployerCompanyProfileMediator',

        VIEW_TYPE: {
            READ: 'EmployerCompanyProfileView',
            EDIT: 'EmployerCompanyProfileEditView'
        }
    });

    return {
        CompanyProfileMediator: CompanyProfileMediator
    };
});
