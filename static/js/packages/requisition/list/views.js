define([
    'jquery',
    'underscore',
    'core',
    'ui',
    'text!./templates/list.html',
    'text!./templates/confirm_delete_modal.html'
], function(
    $,
    _,
    core,
    ui,
    list_template,
    confirm_delete_modal_template) {

    /**
     * Requisition List View Events
     */
    var EVENTS = {
        VIEW_REQ: 'requisitionList:ViewReq',
        EDIT_REQ: 'requisitionList:EditReq',
        OPEN_REQ: 'requisitionList:OpenReq',
        CLOSE_REQ: 'requisitionList:CloseReq',
        DELETE_REQ: 'requisitionList:DeleteReq',
        DELETE_REQ_CONFIRMED: 'requisitionList:DeleteReqConfirmed'
    };

    /**
     * Confirm Requisition Delete Modal View.
     * @constructor
     * @param {Object} options
     *   model: {Requisition} (required)
     */
    var ConfirmDeleteModalView = core.view.View.extend({

        initialize: function(options) {
            this.model = options.model;
            this.template = _.template(confirm_delete_modal_template);
        },

        render: function() {
            this.$el.html(this.template());
            return this;
        },

        onOk: function() {
            var eventBody = {model: this.model};
            this.triggerEvent(EVENTS.DELETE_REQ_CONFIRMED, eventBody);
            return true;
        },

        onCancel: function() {
            return true;
        }
    });

    /**
     * Requisition grid view.
     * @constructor
     * @param {Object} options
     *   collection: {RequisitionCollection} collection (required)
     *   query: {ApiQuery} query (optional)
     */
    var RequisitionGridView = ui.grid.views.GridView.extend({

        events: _.extend({
            // Place events here
            }, ui.grid.views.GridView.prototype.events
        ),

        /**
         * Override
         * Initialize view
         * @param options
         */
        initialize: function(options) {
            options = _.extend({
                config: RequisitionGridView.config()
            }, options);

            ui.grid.views.GridView.prototype.initialize.call(this, options);
        },

        /**
         * Override
         * classes: method to specify css classes on the main
         * grid view.
         */
        classes: function() {
            var result = ui.grid.views.GridView.prototype.classes.call(this);
            result.push('req-summary-grid');
            return result;
        },

        /**
         * @Override
         * Grid Action event handler
         * @param e
         * @param eventBody
         *      model: {Requisition} (required)
         *      action: {
         *          key: 'value'      (required)
         *          label: 'value'    (optional)
         *          handler: function (optional)
         *      }
         */
        onGridAction: function(e, eventBody) {
            var menuItem = eventBody.menuItem;

            if (menuItem) {
                var listEventBody = {model: eventBody.model};
                switch (menuItem.key()) {
                    case 'view':
                        this.triggerEvent(EVENTS.VIEW_REQ, listEventBody);
                        break;
                    case 'edit':
                        this.triggerEvent(EVENTS.EDIT_REQ, listEventBody);
                        break;
                    case 'delete':
                        this.triggerEvent(EVENTS.DELETE_REQ, listEventBody);
                        break;
                    case 'open':
                        this.triggerEvent(EVENTS.OPEN_REQ, listEventBody);
                        break;
                    case 'close':
                        this.triggerEvent(EVENTS.CLOSE_REQ, listEventBody);
                        break;
                }
            }
        }
    }, {
        config: function() {
            var config = {
                columns: [
                    RequisitionGridView.titleColumn(),
                    RequisitionGridView.locationColumn(),
                    RequisitionGridView.statusColumn(),
                    RequisitionGridView.internalIdColumn(),
                    RequisitionGridView.createdColumn(),
                    RequisitionGridView.actionColumn()
                ]
            };
            return config;
        },

        createdColumn: function() {
            return {
                column: 'Created',
                headerCellView: new ui.grid.views.GridHeaderCellView.Factory({
                    sort: 'created'
                }),
                cellView: new ui.grid.views.GridDateCellView.Factory({
                    valueAttribute: 'created',
                    format: 'MM/dd/yy'
                })
            };
        },

        internalIdColumn: function() {
            return {
                column: 'Internal ID',
                headerCellView: new ui.grid.views.GridHeaderCellView.Factory({
                    sort: 'employer_requisition_identifier'
                }),
                cellView: new ui.grid.views.GridCellView.Factory({
                    valueAttribute: 'employer_requisition_identifier'
                })
            };
        },

        titleColumn: function() {
            return {
                column: 'Title',
                headerCellView: new ui.grid.views.GridHeaderCellView.Factory({
                    sort: 'title'
                }),
                cellView: new ui.grid.views.GridLinkCellView.Factory(function(options) {
                    return {
                        href: '/e/requisition/view/' + options.model.get_id(),
                        value: options.model.get_title()
                    };
                })
            };
        },

        locationColumn: function() {
            return {
                column: 'Location',
                cellView: new ui.grid.views.GridCellView.Factory(function(options) {
                    var value = null;
                    var location = options.model.get_location();
                    if (location) {
                        value = location.get_region();
                    }
                    return {
                        value: value
                    };
                })
            };
        },

        statusColumn: function() {
            return {
                column: 'Status',
                headerCellView: new ui.grid.views.GridHeaderCellView.Factory({
                    sort: 'status'
                }),
                cellView: new ui.grid.views.GridCellView.Factory({
                    valueAttribute: 'status'
                })
            };
        },

        actionColumn: function() {
            var map = function(model) {
                var showOpen = model.get_status() === "CLOSED";
                return [
                    {key: 'view', label: 'View'},
                    {key: 'edit', label: 'Edit'},
                    {key: 'divider'},
                    {key: 'open', label: 'Open', visible: showOpen},
                    {key: 'close', label: 'Close', visible: !showOpen},
                    {key: 'divider', visible: false},
                    {key: 'delete', label: 'Delete', visible: false} // TODO
                ];
            };

            return {
                column: '',
                cellView: new ui.grid.views.GridActionCellView.Factory({
                    map: map
                })
            };
        }
    });

    /**
     * Requisitions main view.
     * @constructor
     * @param {Object} options
     *   collection: {RequisitionCollection} (required)
     *   query: {ApiQuery} query (optional)
     */
    var RequisitionsSummaryView = core.view.View.extend({

        contentSelector: '.content',

        initialize: function(options) {
            this.collection = options.collection;
            this.query = options.query.withRelated('location');
            this.template =  _.template(list_template);

            this.query.fetch();

            //child views
            this.requisitionGridView = null;
            this.paginatorView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.destroyChildViews();
            this.requisitionGridView = new RequisitionGridView({
                collection: this.collection,
                query: this.query
            });
            this.paginatorView = new ui.paginator.views.PaginatorView({
                maxPages: 10,
                collection: this.collection,
                query: this.query
            });
        },

        childViews: function() {
            return [
                this.requisitionGridView,
                this.paginatorView
            ];
        },

        render: function() {
            this.$el.html(this.template());
            this.append(this.requisitionGridView, this.contentSelector);
            this.append(this.paginatorView, this.contentSelector);
            return this;
        }
    });

    return {
        EVENTS: EVENTS,
        RequisitionsSummaryView: RequisitionsSummaryView,
        ConfirmDeleteModalView: ConfirmDeleteModalView
    };
});
