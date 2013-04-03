define([
    'jquery',
    'underscore',
    'api/models',
    'core/factory',
    'core/view',
    'talent/applicant/handler',
    'ui/ac/matcher',
    'ui/filter/views',
    'ui/grid/views'
], function(
    $,
    _,
    api,
    factory,
    view,
    applicant_handler,
    ac_matcher,
    filter_views,
    grid_views) {

    /**
     * Tracker Grid view.
     * @constructor
     * @param {Object} options
     *   collection: {ApplicationCollection} collection (required)
     *   query: {ApiQuery} query (required)
     */
    var TrackerGridView = grid_views.GridView.extend({

        initialize: function(options) {
            var config = {
                columns: [
                    TrackerGridView.applicationColumn(),
                    TrackerGridView.requisitionColumn(),
                    TrackerGridView.userColumn(),
                    TrackerGridView.createdColumn(),
                    TrackerGridView.statusColumn(),
                    TrackerGridView.actionColumn(this)
                ]
            };

            options = _.extend({
                config: config
            }, options);

            grid_views.GridView.prototype.initialize.call(this, options);
        },

        classes: function() {
            var result = grid_views.GridView.prototype.classes.call(this);
            result = result.concat(['tracker-grid']);
            return result;
        }
    }, {
        applicationColumn: function() {
            return {
                column: 'Application',
                cellView: new grid_views.GridLinkCellView.Factory(function(options) {
                    return {
                        href: '/talent/application/' + options.model.id,
                        value: options.model.id
                    };
                })
            };
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
                cellView: new grid_views.GridLinkCellView.Factory(function(options) {
                    var requisition = options.model.get_requisition();
                    return {
                        href: '/requisition/view/' + requisition.id,
                        value: requisition.get_title()
                    };
                })
            };
        },

        userColumn: function() {
            return {
                column: 'User',
                cellView: new grid_views.GridLinkCellView.Factory(function(options) {
                    return {
                        href: '/talent/user/' + options.model.get_user_id(),
                        value:'{' + options.model.get_user_id() + '}'
                    };
                })
            };
        },

        createdColumn: function() {
            return {
                column: 'Created',
                headerCellView: new grid_views.GridHeaderCellView.Factory({
                    sort: 'created'
                }),
                cellView: new grid_views.GridDateCellView.Factory({
                    valueAttribute: 'created',
                    format: 'MM/dd/yy'
                })
            };
        },

        actionColumn: function(view) {
            var map = function(model) {
                handler = new applicant_handler.ApplicantHandler({
                    model: model,
                    view: view
                });
                return handler.menuItems();
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
        },

        classes: function() {
            var result = filter_views.FiltersView.prototype.classes.call(this);
            result = result.concat(['tracker-filters']);
            return result;
        }
    }, {
        config: function() {
            var config = {
                filters: [
                    TrackerFiltersView.statusFilter(),
                    TrackerFiltersView.requisitionFilter(),
                    TrackerFiltersView.createdFilter()
                ]
            };
            return config;
        },

        statusFilter: function() {
            return {
                name: 'Status',
                field: 'status',
                filterView: new filter_views.SelectFilterView.Factory({
                    selections: [
                        'NEW', 'REVIEW', 'INTERVIEW_OFFER_PENDING',
                        'INTERVIEW_OFFER_ACCEPTED', 'INTERVIEW_OFFER_DECLINED',
                        'INTERVIEW_OFFER_RESCINDED', 'INTERVIEW_OFFER_EXPIRED',
                        'REJECTED']
                })
            };
        },

        requisitionFilter: function() {
            var createQuery = function(options) {
                var currentUser = new api.User({id: 'CURRENT'});
                return new api.RequisitionCollection().filterBy({
                    'tenant_id': currentUser.get_tenant_id(),
                    'title__istartswith': options.search
                });
            };

            var matcher = new ac_matcher.QueryMatcher({
                queryFactory: new factory.FunctionFactory(createQuery),
                stringify: function(model) {
                    return model.get_title();
                },
                map: function(model) {
                    return {
                        value: model.get_title()
                    };
                }
            });
        
            return {
                name: 'Requsition',
                field: 'requisition__title',
                filterView: new filter_views.AutoSelectFilterView.Factory({
                    inputPlaceholder: 'Requisition title',
                    matcher: matcher
                })
            };
        },

        createdFilter: function() {
            return {
                name: 'Created',
                field: 'created',
                filterView: new filter_views.DateRangeFilterView.Factory()
            };
        }
    });

    return {
        TrackerGridView: TrackerGridView,
        TrackerFiltersView: TrackerFiltersView
    };
});
