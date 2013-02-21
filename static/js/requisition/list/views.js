define([
    'jquery',
    'underscore',
    'core/view',
    'grid/views',
    'paginator/views',
    'api/loader',
    'text!requisition/list/templates/list.html',
    'text!requisition/list/templates/list_item.html'
], function(
    $,
    _,
    view,
    grid_views,
    paginator_views,
    api_loader,
    list_template,
    list_item_template) {

    /**
     * Requisition List View Events
     */
    var EVENTS = {
    };

    /**
     * Requisition list item view.
     * @constructor
     * @param {Object} options
     *   model: Requisition model (required)
     */
    var RequisitionListItemView = view.View.extend({

        tagName: 'li',

        initialize: function() {
            this.template = _.template(list_item_template);
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    /**
     * Requisition list view.
     * @constructor
     * @param {Object} options
     *   collection: RequisitionCollection (required)
     */
    var RequisitionListView = view.View.extend({

        tagName: 'ul',

        initialize: function(options) {
            this.collection = options.collection;
            this.listenTo(this.collection, "reset", this.render);
            this.listenTo(this.collection, "add", this.render);
            this.listenTo(this.collection, "remove", this.render);
            this.childViews = [];
        },

        render: function() {
            console.log('listView render');
            this.destroyChildViews();
            this.childViews = [];
            this.collection.each(this.added, this);
            return this;
        },

        added: function(model) {
            var view = new RequisitionListItemView({
                model: model
            }).render();

            this.childViews.push(view);
            this.$el.append(view.el);
        }
    });

    /**
     * Requisitions main view.
     * @constructor
     * @param {Object} options
     *   collection: {RequisitionCollection} (required)
     */
    var RequisitionsSummaryView = view.View.extend({

        contentSelector: '.content',

        initialize: function(options) {
            console.log('ParentView init');
            this.collection = options.collection;
            this.query = options.query;
            this.template =  _.template(list_template);
            this.gridConfig = null;
            this.initGridConfig();

            //child views
            this.requisitionGridView = null;
            this.paginatorView = null;

            this.loader = new api_loader.ApiLoader([
                {
                    instance: this.collection,
                    withRelated: ['location']
                }
            ]);

            this.loader.load({
                success: _.bind(this.render, this)
            });
        },

        initGridConfig: function() {
            this.gridConfig = {
                columns: [
                    {
                        column: 'Req#',
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
                                    href: '/requisition/req/' + model.get_id(),
                                    value: model.get_title()
                                };
                            }
                        }
                    },
                    {
                        column: 'Location',
                        headerCellView: { options: { sort: 'location__state' } },
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
                        column: 'Actions',
                        cellView: {
                            ctor: grid_views.GridActionCellView,
                            options: function(model) {
                                return {
                                    actions: [
                                        {key: 'close', label: 'Close'},
                                        {key: 'edit', label: 'Edit'},
                                        {key: 'view', label: 'View', handler: function() {console.log('blah');}},
                                        {key: 'divider'},
                                        {key: 'delete', label: 'Delete'}
                                    ]
                                };

                            }
                        }
                    }
                ]
            };
        },

        childViews: function() {
            return [this.requisitionGridView, this.paginatorView];
        },

        render: function() {
            console.log('ParentView render');
            this.destroyChildViews();
            this.$el.html(this.template());

            // setup grid view
            this.requisitionGridView = new grid_views.GridView({
                config: this.gridConfig,
                collection: this.collection,
                query: this.query
            }).render();
            this.$(this.contentSelector).append(this.requisitionGridView.el);

            // setup paginator
            this.paginatorView = new paginator_views.PaginatorView({
                maxPages: 10,
                collection: this.collection,
                query: this.query
            }).render();
            this.$(this.contentSelector).append(this.paginatorView.el);

            return this;
        }
    });

    return {
        EVENTS: EVENTS,
        RequisitionsSummaryView: RequisitionsSummaryView
    };
});
