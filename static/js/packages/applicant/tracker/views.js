define([
    'jquery',
    'underscore',
    'api',
    'core',
    'ui',
    'widget'
], function(
    $,
    _,
    api,
    core,
    ui,
    widget) {

    /**
     * Tracker Grid view.
     * @constructor
     * @param {Object} options
     * @param {ApplicationCollection} options.collection
     *   Application collection
     */
    var TrackerGridView = ui.grid.views.GridView.extend({

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

            ui.grid.views.GridView.prototype.initialize.call(this, options);
        },

        classes: function() {
            var result = ui.grid.views.GridView.prototype.classes.call(this);
            result = result.concat(['tracker-grid']);
            return result;
        }
    }, {
        applicationColumn: function() {
            return {
                column: 'Application',
                cellView: new ui.grid.views.GridLinkCellView.Factory(function(options) {
                    return {
                        href: '/e/application/' + options.model.id + '/',
                        value: '<i class="icon-list-alt"></i>'
                    };
                })
            };
        },

        statusColumn: function() {
            return   {
                column: 'Status',
                headerCellView: new ui.grid.views.GridHeaderCellView.Factory({
                    sort: 'status'
                }),
                cellView: new ui.grid.views.GridCellView.Factory({
                    valueAttribute: 'status'
                })
            };
        },

        requisitionColumn: function() {
            return {
                column: 'Requisition',
                headerCellView: new ui.grid.views.GridHeaderCellView.Factory({
                    sort: 'requisition__title'
                }),
                cellView: new ui.grid.views.GridLinkCellView.Factory(function(options) {
                    var requisition = options.model.get_requisition();
                    return {
                        href: '/e/requisition/view/' + requisition.id + '/',
                        value: requisition.get_title()
                    };
                })
            };
        },

        userColumn: function() {
            return {
                column: 'Applicant',
                headerCellView: new ui.grid.views.GridHeaderCellView.Factory({
                    sort: 'user_id'
                }),
                cellView: new ui.grid.views.GridLinkCellView.Factory(function(options) {
                    return {
                        href: '/e/user/' + options.model.get_user_id() + '/',
                        value:'{' + options.model.get_user_id() + '}'
                    };
                })
            };
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

        actionColumn: function(view) {
            var map = function(model) {
                var handler = new widget.application.handlers.ApplicationHandler({
                    model: model,
                    view: view
                });
                return handler.menuItems();
            };
            return {
                key: 'action',
                column: '',
                cellView: new ui.grid.views.GridActionCellView.Factory({
                    map: map
                })
            };
        }
    });

    /**
     * Tracker Filters View.
     * @constructor
     * @param {Object} options
     * @param {ApplicationCollection} options.collection
     *  Application collection
     * @param {boolean} [options.horizontal=false] Horizontal layout flag
     */
    var TrackerFiltersView = ui.filter.views.FiltersView.extend({

        initialize: function(options) {
            options = _.extend({
                config: TrackerFiltersView.config()
            }, options);

            ui.filter.views.FiltersView.prototype.initialize.call(this, options);
        },

        classes: function() {
            var result = ui.filter.views.FiltersView.prototype.classes.call(this);
            result = result.concat(['tracker-filters']);
            return result;
        }
    }, {
        config: function() {
            var config = {
                filters: [
                    TrackerFiltersView.statusFilter(),
                    TrackerFiltersView.requisitionFilter(),
                    TrackerFiltersView.applicantFilter(),
                    TrackerFiltersView.createdFilter()
                ]
            };
            return config;
        },

        applicantFilter: function() {
            var createQuery = function(options) {
                var currentUser = new api.models.User({id: 'CURRENT'});
                return currentUser.get_tenant().get_applications()
                    .orderBy('created__desc')
                    .slice(0, 40)
                    .query();
            };

            var matcher = new ui.ac.matcher.QueryMatcher({
                queryFactory: new core.factory.FunctionFactory(createQuery),
                stringify: function(model) {
                    return model.get_user_id();
                },
                map: function(model) {
                    return {
                        value: model.get_user_id()
                    };
                },
                sort: null
            });

            return {
                name: 'Applicant',
                field: 'user_id',
                filterView: new ui.filter.views.AutoSelectFilterView.Factory({
                    inputPlaceholder: 'Applicant ID',
                    matcher: matcher
                })
            };
        },

        statusFilter: function() {
            return {
                name: 'Status',
                field: 'status',
                filterView: new ui.filter.views.SelectFilterView.Factory({
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
                var currentUser = new api.models.User({id: 'CURRENT'});
                return new api.models.RequisitionCollection()
                    .filterBy({
                        'tenant_id': currentUser.get_tenant_id()
                    })
                    .orderBy('created__DESC')
                    .slice(0, 40)
                    .query();
            };

            var matcher = new ui.ac.matcher.QueryMatcher({
                queryFactory: new core.factory.FunctionFactory(createQuery),
                stringify: function(model) {
                    return model.get_title();
                },
                map: function(model) {
                    return {
                        value: model.get_title()
                    };
                },
                sort: null
            });
        
            return {
                name: 'Requsition',
                field: 'requisition__title',
                filterView: new ui.filter.views.AutoSelectFilterView.Factory({
                    inputPlaceholder: 'Requisition title',
                    matcher: matcher
                })
            };
        },

        createdFilter: function() {
            return {
                name: 'Created',
                field: 'created',
                filterView: new ui.filter.views.DateRangeFilterView.Factory()
            };
        }
    });

    return {
        TrackerGridView: TrackerGridView,
        TrackerFiltersView: TrackerFiltersView
    };
});
