define([
    'underscore',
    'common/notifications',
    'core/mediator',
    'current/proxies',
    'alert/mediators',
    'alert/models',
    'api/models',
    'requisition/notifications',
    'requisition/req/views',
    'requisition/list/mediators'
], function(
    _,
    notifications,
    mediator,
    current_proxies,
    alert_mediators,
    alert_models,
    api,
    requisition_notifications,
    requisition_views) {

    /**
     * Requisition Mediator
     * @constructor
     */
    var RequisitionMediator = mediator.Mediator.extend({

        /**
         * Method to retrieve the RequisitionListMediators view type.
         * This view type is used when we need to navigate to views controlled
         * by the RequisitionListMediator.
         * @private
         */
        _getRequisitionListMediatorViewType: function() {
            // The RequisitionListMediator name is hard coded here to prevent a
            // circular dependency which would arise if we were to import
            // the mediator.
            var requisitionListMediator = this.facade.getMediator('RequisitionListMediator');
            return requisitionListMediator.viewType();
        },

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

        /**
         *
         * @param notification Notification options
         *      type: Mediator's view type (required)
         *      options.id: Requisition model ID (optional)
         */
        onCreateView: function(notification) {
            if (notification.type === this.viewType()) {

                var requisition = new api.Requisition({
                    id: notification.options.id
                });
                this.view = new requisition_views.RequisitionView({
                    action: notification.options.action,
                    model: requisition,
                    userModel: this.currentProxy.currentUser()
                });

                // Add event listeners
                this.view.addEventListener(requisition_views.EVENTS.SAVED, this.onSaved, this);
                this.view.addEventListener(requisition_views.EVENTS.SAVE_FAILED, this.onSaveFailed, this);
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
                    type: notification.type,
                    view: notification.view
                });
                if(this.view === notification.view) {
                    this.view = null;
                }
            }
        },

        /**
         * Function to handle SAVED events
         * @param e Event
         * @param eventBody Event body. Expecting:
         *      id: model ID (required)
         */
        onSaved: function(e, eventBody) {
            this.facade.trigger(notifications.VIEW_NAVIGATE, {
                type: this.viewType(),
                options: {
                    id: eventBody.id,
                    action: "read"
                }
            });

            // create alert status for successful creation
            this.facade.trigger(notifications.VIEW_CREATE, {
                type: alert_mediators.AlertMediator.VIEW_TYPE,
                severity: alert_models.SEVERITY.SUCCESS,
                style: alert_models.STYLE.NORMAL,
                message: 'Requisition updated successfully'
            });
        },

        /**
         * Function to handle SAVE_FAILED events
         * @param e Event
         * @param eventBody Event body. Expecting empty body.
         */
        onSaveFailed: function(e, eventBody) {
            // Set error message
            var errorMessage = 'There was an error saving your data. ' +
                'Please review your form and try again.';
            if (eventBody.errorMessage) {
                errorMessage = eventBody.errorMessage;
            }

            // create alert status for error
            this.facade.trigger(notifications.VIEW_CREATE, {
                type: alert_mediators.AlertMediator.VIEW_TYPE,
                severity: alert_models.SEVERITY.ERROR,
                style: alert_models.STYLE.NORMAL,
                message: errorMessage
            });
        },

        /**
         * Function to handle CANCELED events
         * @param e Event
         * @param eventBody Event body. Expecting:
         *      id: model ID (optional)
         *      If provided will route user back to req details view
         */
        onCanceled: function(e, eventBody) {
            // Bring user back to req details view, if the req exists;
            // otherwise bring the user to the req list view.
            if (eventBody.id) {
                this.facade.trigger(notifications.VIEW_NAVIGATE, {
                    type: this.viewType(),
                    options: {
                        id: eventBody.id,
                        action: "read"
                    }
                });
            } else {
                this.facade.trigger(notifications.VIEW_NAVIGATE, {
                    type: this._getRequisitionListMediatorViewType(),
                    options: {}
                });
            }
        }

    }, {

        NAME: 'RequisitionMediator',

        VIEW_TYPE: 'RequisitionView'
    });

    return {
        RequisitionMediator: RequisitionMediator
    };
});
