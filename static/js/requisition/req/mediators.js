define([
    'underscore',
    'common/notifications',
    'core/mediator',
    'current/proxies',
    'api/models',
    'requisition/notifications',
    'requisition/req/views',
    'requisition/list/mediators'
], function(
    _,
    notifications,
    mediator,
    current_proxies,
    api,
    requisition_notifications,
    requisition_views,
    requisition_list_mediators) {

    /**
     * Requisition Mediator
     * @constructor
     */
    var RequisitionMediator = mediator.Mediator.extend({
        name: function() {
            return RequisitionMediator.NAME;
        },

        viewType: function() {
            return RequisitionMediator.VIEW_TYPE;
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
            this.currentProxy = this.facade.getProxy(current_proxies.CurrentProxy.NAME);
        },

        onCreateView: function(notification) {
            if(notification.type === this.viewType()) {

                var requisition = new api.Requisition({
                    id: notification.options.id
                });
                this.view = new requisition_views.RequisitionView({
                    model: requisition,
                    userModel: this.currentProxy.currentUser()
                });

                // Add event listeners
                this.view.addEventListener(requisition_views.EVENTS.SAVED, this.onSaved, this);
                this.view.addEventListener(requisition_views.EVENTS.CANCELED, this.onCanceled, this);

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
        },

        onSaved: function(e, eventBody) {
            this.facade.trigger(notifications.VIEW_NAVIGATE, {
                type: this.viewType(),
                options: {
                    id: eventBody.id
                }
            });
        },

        onCanceled: function(e, eventBody) {
            this.facade.trigger(notifications.VIEW_NAVIGATE, {
                type: requisition_list_mediators.RequisitionListMediator.VIEW_TYPE,
                options: {}
            });
        }

    }, {

        NAME: 'RequisitionMediator',

        VIEW_TYPE: 'RequisitionView'
    });

    return {
        RequisitionMediator: RequisitionMediator
    };
});
