define([
    'jquery',
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
    $,
    _,
    notifications,
    mediator,
    current_proxies,
    alert_mediators,
    alert_models,
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

        onSaved: function(e, eventBody) {
            this.facade.trigger(notifications.VIEW_NAVIGATE, {
                type: this.viewType(),
                options: {
                    id: eventBody.id
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

        onSaveFailed: function(e, eventBody) {
            // Set error message
            var errorMessage = 'There was an error saving your data. Please review your form and try again.';
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

            // scroll to top of page
            $('html,body').scrollTop(0);
        },

        onCanceled: function(e, eventBody) {
            // Bring user back to req details view, if the req exists;
            // otherwise bring the user to the req list view.
            if (eventBody.id) {
                this.facade.trigger(notifications.VIEW_NAVIGATE, {
                    type: this.viewType(),
                    options: {
                        id: eventBody.id
                    }
                });
            } else {
                this.facade.trigger(notifications.VIEW_NAVIGATE, {
                    type: requisition_list_mediators.RequisitionListMediator.VIEW_TYPE,
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
