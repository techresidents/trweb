define([
    'underscore',
    'common/notifications',
    'core/mediator',
    'api/models',
    'requisition/notifications',
    'requisition/req/views',
    'requisition/list/mediators'
], function(
    _,
    notifications,
    mediator,
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
        },

        onCreateView: function(notification) {
            if(notification.type === this.viewType()) {

                var requisition = new api.Requisition({
                    id: notification.options.id
                });
                this.view = new requisition_views.RequisitionView({
                    model: requisition
                });

                // Add event listeners
                this.view.addEventListener(requisition_views.EVENTS.SAVE, this.onSave, this);
                this.view.addEventListener(requisition_views.EVENTS.CANCEL, this.onCancel, this);

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

        onSave: function(e, eventBody) {
            console.log('onSave');
            console.log(eventBody);
            this.facade.trigger(notifications.VIEW_NAVIGATE, {
                type: this.viewType(),
                options: {
                    id: eventBody.id
                }
            });
        },

        onCancel: function(e, eventBody) {
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
