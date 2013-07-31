define([
    'underscore',
    'notifications',
    'core',
    'ctrl',
    'alert',
    'api',
    './views'
], function(
    _,
    notifications,
    core,
    ctrl,
    alert,
    api,
    views) {

    /**
     * Requisition Mediator
     * @constructor
     */
    var RequisitionMediator = core.mediator.Mediator.extend({

        name: function() {
            return RequisitionMediator.NAME;
        },

        isViewType: function(type) {
            return _.contains(RequisitionMediator.VIEW_TYPE, type);
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
            this.currentProxy = this.facade.getProxy(
                    ctrl.proxies.current.CurrentProxy.NAME);
        },

        createReadView: function(options) {
            var model = new api.models.Requisition({
                id: options.id
            });
            return new views.RequisitionView({
                model: model
            });
        },

        createEditView: function(options) {
            var model = new api.models.Requisition({
                id: options.id
            });
            return new views.EditRequisitionView({
                model: model
            });
        },

        createCreateView: function(options) {
            var model = new api.models.Requisition();
            return new views.CreateRequisitionView({
                model: model
            });
        },

        onCreateView: function(notification) {
            if(!this.isViewType(notification.type)) {
                return;
            }

            var view;
            switch(notification.type) {
                case RequisitionMediator.VIEW_TYPE.READ:
                    view = this.createReadView(notification.options);
                    break;
                case RequisitionMediator.VIEW_TYPE.EDIT:
                    view = this.createEditView(notification.options);
                    break;
                case RequisitionMediator.VIEW_TYPE.CREATE:
                    view = this.createCreateView(notification.options);
                    break;
            }

            this.facade.trigger(notifications.VIEW_CREATED, {
                type: notification.type,
                view: view,
                options: notification.options
            });
        },

        onDestroyView: function(notification) {
            if(this.isViewType(notification.type)) {
                notification.view.destroy();
                this.facade.trigger(notifications.VIEW_DESTROYED, {
                    type: notification.type,
                    view: notification.view
                });
            }
        }

    }, {

        NAME: 'RequisitionMediator',

        VIEW_TYPE: {
            READ: 'RequisitionReadView',
            EDIT: 'RequisitionEditView',
            CREATE: 'RequisitionCreateView'
        }
    });

    return {
        RequisitionMediator: RequisitionMediator
    };
});
