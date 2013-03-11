define([
    'jquery',
    'underscore',
    'core/view',
    'grid/views',
    'paginator/views',
    'api/loader',
    'text!requisition/list/templates/list.html',
    'text!requisition/list/templates/confirm_delete_modal.html'
], function(
    $,
    _,
    view,
    grid_views,
    paginator_views,
    api_loader,
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
    var ConfirmDeleteModalView = view.View.extend({

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
    var RequisitionGridView = grid_views.GridView.extend({

        events: _.extend({
            // Place events here
            }, grid_views.GridView.prototype.events
        ),

        /**
         * Override
         * Initialize view
         * @param options
         */
        initialize: function(options) {
            this._initConfig(options);
            grid_views.GridView.prototype.initialize.apply(this, arguments);
        },

        /**
         * Override
         * classes: method to specify css classes on the main
         * grid view.
         */
        classes: function() {
            var result = grid_views.GridView.prototype.classes.call(this);
            result.push('req-summary-grid');
            return result;
        },

        _initConfig: function(options) {
            var that = this;
            options.config = {
                columns: [
                    {
                        column: 'Created',
                        headerCellView: { options: { sort: 'created' } },
                        cellView: {
                            options: function (model) {
                                var value = that.fmt.date(
                                    model.get_created(),
                                    'MM/dd/yy'
                                );
                                return {
                                    value: value
                                };
                            }
                        }
                    },
                    {
                        column: 'Internal ID',
                        headerCellView: { options: { sort: 'employer_requisition_identifier' } },
                        cellView: { options: { valueAttribute: 'employer_requisition_identifier' } }
                    },
                    {
                        column: 'Title',
                        headerCellView: { options: { sort: 'title' } },
                        cellView: {
                            ctor: grid_views.GridLinkCellView,
                            options: function (model) {
                                return {
                                    href: '/requisition/view/' + model.get_id(),
                                    value: model.get_title()
                                };
                            }
                        }
                    },
                    {
                        column: 'Location',
                        headerCellView: {},
                        cellView: {
                            options: function (model) {
                                var value = null;
                                var location = model.get_location();
                                if (location.get_city()) {
                                    value = location.get_city() + ', ' + location.get_state();
                                } else {
                                    value = location.get_state();
                                }
                                return {
                                    value: value
                                };
                            }
                        }
                    },
                    {
                        column: 'Status',
                        headerCellView: { options: { sort: 'status' } },
                        cellView: { options: { valueAttribute: 'status' } }
                    },
                    {
                        column: '',
                        cellView: {
                            ctor: grid_views.GridActionCellView,
                            options: function(model) {
                                return that._getGridActions(model);
                            }
                        }
                    }
                ]
            };
        },

        /**
         * Method to generate grid actions
         * @param model {Requisition} (required)
         * @private
         */
        _getGridActions: function(model) {
            // Set openOrCloseAction based upon model's current status
            var openOrCloseAction = null;
            if (model.get_status() === "OPEN") {
                openOrCloseAction = {
                    key: 'close',
                    label: 'Close'
                };
            } else {
                openOrCloseAction = {
                    key: 'open',
                    label: 'Open'
                };
            }

            return {
                actions: [
                    {key: 'view', label: 'View'},
                    {key: 'edit', label: 'Edit'},
                    {key: 'divider'},
                    openOrCloseAction,
                    {key: 'divider'},
                    {key: 'delete', label: 'Delete'}
                ]
            };
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
            if (eventBody.model && eventBody.action.key) {
                var listEventBody = {model: eventBody.model};
                switch (eventBody.action.key) {
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
    });

    /**
     * Requisitions main view.
     * @constructor
     * @param {Object} options
     *   collection: {RequisitionCollection} (required)
     *   query: {ApiQuery} query (optional)
     */
    var RequisitionsSummaryView = view.View.extend({

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
            this.paginatorView = new paginator_views.PaginatorView({
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
