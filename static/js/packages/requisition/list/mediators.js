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
                trigger: false
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
