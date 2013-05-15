define([
    'underscore',
    'notifications',
    'core',
    'alert',
    'ctrl',
    'api',
    'ui',
    './views'
], function(
    _,
    notifications,
    core,
    alert,
    ctrl,
    api,
    ui,
    requisition_list_views
) {

    /**
     * Requisition Mediator
     * @constructor
     */
    var RequisitionListMediator = core.mediator.Mediator.extend({

        /**
         * Method to retrieve the RequisitionMediators view type.
         * This view type is used when we need to navigate to views controlled
         * by the RequisitionMediator.
         * @private
         */
        _getRequisitionMediatorViewType: function() {
            // The RequisitionMediator name is hard coded here to prevent a
            // circular dependency which would arise if we were to import
            // the mediator.
            var requisitionMediator = this.facade.getMediator('RequisitionMediator');
            return requisitionMediator.viewType();
        },

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
            var user;
            this.currentProxy = this.facade.getProxy(
                    ctrl.proxies.current.CurrentProxy.NAME);
            user = this.currentProxy.currentUser();
            this.defaultCollection = user.get_tenant().get_requisitions();
            this.defaultQuery = this.defaultCollection.query()
                .slice(0, 10).orderBy('created__desc');

            this.view = null;
            this.collection = null;
            this.query = null;
        },

        /**
         * onCreateView
         * @param notification Notification options
         *      type: Mediator's view type (required)
         *      options.query: {ApiQuery} (optional)
         */
        onCreateView: function(notification) {
            if (notification.type === this.viewType()) {
                // Setup query
                var uri = notification.options.query || this.defaultQuery.toUri();
                this.collection = this.defaultCollection.clone();
                this.collection.on('reset', this.onReset, this);
                this.query = api.query.ApiQuery.parse(this.collection, uri);
                this.view = new requisition_list_views.RequisitionsSummaryView({
                    collection: this.collection,
                    query: this.query
                });

                // Add event listeners
                this.view.addEventListener(this.cid, requisition_list_views.EVENTS.VIEW_REQ, this.onViewReq, this);
                this.view.addEventListener(this.cid, requisition_list_views.EVENTS.EDIT_REQ, this.onEditReq, this);
                this.view.addEventListener(this.cid, requisition_list_views.EVENTS.OPEN_REQ, this.onOpenReq, this);
                this.view.addEventListener(this.cid, requisition_list_views.EVENTS.CLOSE_REQ, this.onCloseReq, this);
                this.view.addEventListener(this.cid, requisition_list_views.EVENTS.DELETE_REQ, this.onDeleteReq, this);

                this.facade.trigger(notifications.VIEW_CREATED, {
                    type: this.viewType(),
                    view: this.view,
                    options: _.extend(notification.options, {
                        collection: this.collection,
                        query: this.query
                    })
                });
            }
        },

        /**
         * onDestroyView
         * @param notification Notification options
         *      type: View type which indicates if this mediator is responsible
         *          for destroying this view (required)
         *      view: {View} (required)
         *      options.collection: {RequisitionCollection} (required)
         */
        onDestroyView: function(notification) {
            if (notification.type === this.viewType()) {
                notification.view.destroy();
                notification.options.collection.off('reset', this.onReset, this);

                this.facade.trigger(notifications.VIEW_DESTROYED, {
                    type: this.viewType(),
                    view: notification.view
                });
                if (this.view === notification.view) {
                    this.view = null;
                }
            }
        },

        /**
         * Method to listen for reset events on the collection
         * and update the URL to include any query parameters.
         */
        onReset: function() {
            // Fix back button bug. This will prevent an infinite loop
            // where the back button takes the user to page such as
            // /requisition/list which then redirects to
            // /requisition/list?<defaultQuery>
            var uri = this.query.toUri();
            if (uri === this.defaultQuery.toUri()) {
                uri = null;
            }
            this.facade.trigger(notifications.VIEW_NAVIGATE, {
                type: this.viewType(),
                query: uri,
                trigger: false,
                replace: false
            });
        },

        /**
         * Method to bring the user to the req details view
         * @param e Event
         * @param eventBody Event body. Expecting:
         *      model: {Requisition} (required)
         */
        onViewReq: function(e, eventBody) {
            if (eventBody.model) {
                this.facade.trigger(notifications.VIEW_NAVIGATE, {
                    type: this._getRequisitionMediatorViewType(),
                    options: {
                        id: eventBody.model.id,
                        action: 'read'
                    }
                });
            }
        },

        /**
         * Method to bring the user to the edit req view
         * @param e Event
         * @param eventBody Event body
         *      model: {Requisition} (required)
         */
        onEditReq: function(e, eventBody) {
            if (eventBody.model) {
                this.facade.trigger(notifications.VIEW_NAVIGATE, {
                    type: this._getRequisitionMediatorViewType(),
                    options: {
                        id: eventBody.model.id,
                        action: 'edit'
                    }
                });
            }
        },

        /**
         * Method to open a requisition
         * @param e Event
         * @param eventBody Event body
         *      model: {Requisition} (required)
         */
        onOpenReq: function(e, eventBody) {
            if (eventBody.model) {
                var reqModel = eventBody.model;
                if (reqModel.get_status() !== 'OPEN') {
                    reqModel.save({
                        status: 'OPEN'
                    }, {
                        wait: true,
                        error: function(model) {
                            this.onSaveFailed();
                        }
                    });
                }
            }
        },

        /**
         * Method to close a requisition
         * @param e Event
         * @param eventBody Event body
         *      model: {Requisition} (required)
         */
        onCloseReq: function(e, eventBody) {
            if (eventBody.model) {
                var reqModel = eventBody.model;
                if (reqModel.get_status() !== 'CLOSED') {
                    reqModel.save({
                        status: 'CLOSED'
                    }, {
                        wait: true,
                        error: function(model) {
                            this.onSaveFailed();
                        }
                    });
                }
            }
        },

        /**
         * Listens for 'delete' button and
         * asks the user to confirm delete.
         * @param e Event
         * @param eventBody Event body. Expecting:
         *      model: {Requisition} (required)
         */
        onDeleteReq: function(e, eventBody) {
            var model = eventBody.model;
            if (model) {
                // TODO create this modal once in init. The problem was
                // that this ModalView calls remove() which removes events.
                // Call detach instead?
                var modalView = new ui.modal.views.ModalView({
                    title: 'Confirm Delete',
                    exitOnBackdropClick: true,
                    exitOnEscapeKey: true,
                    view: new requisition_list_views.ConfirmDeleteModalView({
                        model: model
                    })
                });
                modalView.addEventListener(this.cid, requisition_list_views.EVENTS.DELETE_REQ_CONFIRMED, this.onDeleteReqConfirmed, this);
                modalView.render();
            }
        },

        /**
         * Method to delete the specified Requisition
         * @param e Event
         * @param eventBody Event body. Expecting:
         *      model: {Requisition} (required)
         */
        onDeleteReqConfirmed: function(e, eventBody) {
            var model = eventBody.model;
            if (model) {
                console.log('destroying req');
                // TODO setup apisvc for mark-as-delete behavior
                //model.destroy();
                // TODO show alert on error
            }
        },

        /**
         * onSaveFailed
         * Method to generate an error alert if saving fails.
         */
        onSaveFailed: function() {

            // Set error message
            var errorMessage = 'There was an error updating your data. ' +
                'Please try again.';

            // create alert status for error
            this.facade.trigger(notifications.VIEW_CREATE, {
                type: alert.mediators.AlertMediator.VIEW_TYPE,
                severity: alert.models.SEVERITY.ERROR,
                style: alert.models.STYLE.NORMAL,
                message: errorMessage
            });
        }

    }, {
        NAME: 'RequisitionListMediator',
        VIEW_TYPE: 'RequisitionListView'
    });

    return {
        RequisitionListMediator: RequisitionListMediator
    };
});
