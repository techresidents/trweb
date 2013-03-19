define([
    'jquery',
    'underscore',
    'core/view',
    'api/models',
    'filter/views',
    'grid/views',
    'paginator/views',
    'text!talent/tracker/templates/tracker.html'
], function(
    $,
    _,
    view,
    api,
    filter_views,
    grid_views,
    paginator_views,
    tracker_template) {

    var EVENTS = {
        QUERY_CHANGED: 'TRACKER_QUERY_CHANGED_EVENT'
    };

    /**
     * Tracker Grid view.
     * @constructor
     * @param {Object} options
     *   collection: {ApplicationCollection} collection (required)
     *   query: {ApiQuery} query (required)
     */
    var TrackerGridView = grid_views.GridView.extend({

        initialize: function(options) {
            options = _.extend({
                config: TrackerGridView.config()
            }, options);

            grid_views.GridView.prototype.initialize.call(this, options);
        }
    }, {
        config: function() {
            var config = {
                columns: [
                    TrackerGridView.statusColumn(),
                    TrackerGridView.requisitionColumn(),
                    TrackerGridView.userColumn(),
                    TrackerGridView.actionColumn()
                ]
            };
            return config;
        },
        
        statusColumn: function() {
            return   {
                column: 'Status',
                headerCellView: new grid_views.GridHeaderCellView.Factory({
                    sort: 'status'
                }),
                cellView: new grid_views.GridCellView.Factory({
                    valueAttribute: 'status'
                })
            };
        },

        requisitionColumn: function() {
            return {
                column: 'Requisition',
                headerCellView: new grid_views.GridHeaderCellView.Factory({
                    sort: 'requisition__title'
                }),
                cellView: new grid_views.GridCellView.Factory({
                    valueAttribute: 'requisition__title'
                })
            };
        },

        userColumn: function() {
            return {
                column: 'User',
                cellView: new grid_views.GridLinkCellView.Factory(function(options) {
                    return {
                        href: '/talent/user/' + options.model.get_user_id(),
                        value: options.model.get_user_id()
                    };
                })
            };
        },

        actionColumn: function() {
            var map = function(model) {
                return [
                    {key: 'open', label: 'Open', handler: function() {console.log('blah');}},
                    {key: 'divider'},
                    {key: 'close', label: 'Close'}
                ];
            };

            return {
                column: '',
                cellView: new grid_views.GridActionCellView.Factory({
                    map: map
                })
            };
        }
    });

    /**
     * Tracker Filters View.
     * @constructor
     * @param {Object} options
     */
    var TrackerFiltersView = filter_views.FiltersView.extend({

        initialize: function(options) {
            options = _.extend({
                config: TrackerFiltersView.config()
            }, options);

            filter_views.FiltersView.prototype.initialize.call(this, options);
        }
    }, {
        config: function() {
            var config = {
                filters: [
                    TrackerFiltersView.cityFilter(),
                    TrackerFiltersView.requisitionFilter(),
                    TrackerFiltersView.dateFilter()
                ]
            };
            return config;
        },

        cityFilter: function() {
            return {
                name: 'City',
                field: 'city',
                filterView: new filter_views.SelectFilterView.Factory({
                    selections: ['Boston', 'San Francisco']
                })
            };
        },

        requisitionFilter: function() {
            var auto = function(search, collection) {
                var query = new api.RequisitionCollection().filterBy({
                    'title__istartswith': search
                }).slice(0, 8);

                query.fetch({
                    success: function() {
                        collection.reset(query.instance.map(function(model) {
                            return {
                                value: model.get_title()
                            };
                        }));
                    }
                });
            };
        
            return {
                name: 'Requsition',
                field: 'requisition__title',
                filterView: new filter_views.AutoSelectFilterView.Factory({
                    inputPlaceholder: 'Requisition title',
                    auto: auto
                })
            };
        },

        dateFilter: function() {
            return {
                name: 'Date',
                field: 'zip',
                filterView: new filter_views.DateRangeFilterView.Factory()
            };
        }
    });


    /**
     * Tracker view.
     * @constructor
     * @param {Object} options
     *   collection: {ApplicationCollection} collection (required)
     *   query: {ApiQuery} query (required)
     */
    var TrackerView = view.View.extend({
            
        events: {
        },

        childViews: function() {
            return [this.filtersView, this.gridView, this.paginatorView];
        },

        initialize: function(options) {
            this.template =  _.template(tracker_template);
            this.collection = options.collection;
            this.query = options.query.withRelated('requisition');
            this.query.fetch();

            //child views
            this.filtersView = null;
            this.gridView = null;
            this.paginatorView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.filtersView = new TrackerFiltersView({
                collection: this.collection,
                query: this.query,
                horizontal: true
            });

            this.gridView = new TrackerGridView({
                collection: this.collection,
                query: this.query
            });

            this.paginatorView = new paginator_views.PaginatorView({
                maxPages: 10,
                collection: this.collection,
                query: this.query
            });
        },

        
        render: function() {
            this.$el.html(this.template());
            this.append(this.filtersView, '.content');
            this.append(this.gridView, '.content');
            this.append(this.paginatorView, '.content');
            return this;
        }
    });

    return {
        EVENTS: EVENTS,
        TrackerView: TrackerView
    };
});
