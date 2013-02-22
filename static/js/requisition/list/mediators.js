define([
    'underscore',
    'common/notifications',
    'core/mediator',
    'current/proxies',
    'api/models',
    'requisition/notifications',
    'requisition/list/views'
], function(
    _,
    notifications,
    mediator,
    current_proxies,
    api,
    requisition_notifications,
    requisition_list_views) {

    /**
     * Requisition Mediator
     * @constructor
     */
    var RequisitionListMediator = mediator.Mediator.extend({
        name: function() {
            return RequisitionListMediator.NAME;
        },

        viewType: function() {
            return RequisitionListMediator.VIEW_TYPE;
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
                var user = this.currentProxy.currentUser();
                var collection = user.get_tenant().get_requisitions();
                this.view = new requisition_list_views.RequisitionsSummaryView({
                    collection: collection,
                    query: collection.query().slice(0, 10)
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

        NAME: 'RequisitionListMediator',

        VIEW_TYPE: 'RequisitionListView'
    });

    return {
        RequisitionListMediator: RequisitionListMediator
    };
});
