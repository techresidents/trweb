define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'events',
    'ui',
    'widget',
    'text!./templates/offers.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    events,
    ui,
    widget,
    employer_offers_template) {

    /**
     * Offers Grid view.
     * @constructor
     * @param {Object} options
     * @param {InterviewOfferCollection} options.collection
     *  InterviewOffer collection
     */
    var OffersGridView = ui.grid.views.GridView.extend({

        initialize: function(options) {
            var config = {
                columns: [
                    OffersGridView.candidateColumn(),
                    OffersGridView.interviewTypeColumn(),
                    OffersGridView.requisitionColumn(),
                    OffersGridView.createdColumn(),
                    OffersGridView.expiresColumn(),
                    OffersGridView.statusColumn(),
                    OffersGridView.actionColumn(this)
                ]
            };

            options = _.extend({
                config: config
            }, options);

            ui.grid.views.GridView.prototype.initialize.call(this, options);
        },

        classes: function() {
            var result = ui.grid.views.GridView.prototype.classes.call(this);
            result = result.concat(['offers-grid']);
            return result;
        }
    }, {
        candidateColumn: function() {
            return {
                column: 'Candidate',
                headerCellView: new ui.grid.views.GridHeaderCellView.Factory({
                    sort: 'candidate_id'
                }),
                cellView: new ui.grid.views.GridLinkCellView.Factory(function(options) {
                    return {
                        href: '/e/user/' + options.model.get_candidate_id() + '/',
                        value: '{' + options.model.get_candidate_id() + '}'
                    };
                })
            };
        },

        interviewTypeColumn: function() {
            return {
                column: 'Interview Type',
                headerCellView: new ui.grid.views.GridHeaderCellView.Factory({
                    sort: 'type'
                }),
                cellView: new ui.grid.views.GridCellView.Factory({
                    valueAttribute: 'type'
                })
            };
        },

        requisitionColumn: function() {
            return {
                column: 'Requisition',
                headerCellView: new ui.grid.views.GridHeaderCellView.Factory({
                    sort: 'application__requisition__title'
                }),
                cellView: new ui.grid.views.GridLinkCellView.Factory(function(options) {
                    var requisition = options.model.get_application().get_requisition();
                    return {
                        href: '/e/requisition/view/' + requisition.id + '/',
                        value: requisition.get_title()
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

        expiresColumn: function() {
            return {
                column: 'Expires',
                headerCellView: new ui.grid.views.GridHeaderCellView.Factory({
                    sort: 'expires'
                }),
                cellView: new ui.grid.views.GridDateCellView.Factory({
                    valueAttribute: 'expires',
                    format: 'MM/dd/yy'
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

        actionColumn: function(view) {
            var map = function(model) {
                var handler = new widget.application.handlers.ApplicationHandler({
                    model: model.get_application(),
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
     * Offers Filters View.
     * @constructor
     * @param {Object} options
     * @param {InterviewOfferCollection} options.collection
     *  InterviewOffer collection
     */
    var OffersFiltersView = ui.filter.views.FiltersView.extend({

        initialize: function(options) {
            options = _.extend({
                config: OffersFiltersView.config()
            }, options);

            ui.filter.views.FiltersView.prototype.initialize.call(this, options);
        },

        classes: function() {
            var result = ui.filter.views.FiltersView.prototype.classes.call(this);
            result = result.concat(['offers-filters']);
            return result;
        }
    }, {
        config: function() {
            var config = {
                filters: [
                    OffersFiltersView.statusFilter(),
                    OffersFiltersView.typeFilter(),
                    OffersFiltersView.requisitionFilter(),
                    OffersFiltersView.createdFilter(),
                    OffersFiltersView.expiresFilter()
                ]
            };
            return config;
        },

        statusFilter: function() {
            return {
                name: 'Status',
                field: 'status',
                filterView: new ui.filter.views.SelectFilterView.Factory({
                    selections: [
                        'PENDING',
                        'ACCEPTED',
                        'DECLINED',
                        'RESCINDED',
                        'EXPIRED']
                })
            };
        },

        typeFilter: function() {
            return {
                name: 'Type',
                field: 'type',
                filterView: new ui.filter.views.SelectFilterView.Factory({
                    selections: [
                        'IN_HOUSE',
                        'PHONE']
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
                field: 'application__requisition__title',
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
        },

        expiresFilter: function() {
            return {
                name: 'Expires',
                field: 'expires',
                filterView: new ui.filter.views.DateRangeFilterView.Factory()
            };
        }
    });

    /**
     * Employer Offers Page View
     * @constructor
     * @param {Object} options
     * @param {InterviewOfferCollection} options.collection InterviewOffer collection
     */
    var EmployerOffersView = core.view.View.extend({

        contentSelector: '.offers-container',

        events: {
        },

        initialize: function(options) {
            this.template =  _.template(employer_offers_template);
            // TODO Move withRelated into view
            // It's expected that the collection passed to this view
            // has a withRelated field of ['application__requisition']
            this.loader = new api.loader.ApiLoader([
                { instance: this.collection }
            ]);

            //bind events
            this.listenTo(this.loader, 'loaded', this.render);

            //load data
            this.loader.load();

            //child views
            this.filtersView = null;
            this.gridView = null;
            this.paginatorView = null;
            this.initChildViews();

            // This flag is set to indicate that our child views have been
            // initialized.  There's currently a problem when loading cached
            // collections whereby the loader loads them from cache really quickly
            // which triggers a 'loaded' event, which then invokes 'render' before
            // our views have been created.  Models don't suffer from this
            // problem because if it's cached, the model pulls all the cached
            // data into it's own instance which then prevents the loader from even
            // trying to load the data, and thus no 'loaded' event is triggered.
            this.initialized = true;
        },

        childViews: function() {
            return [
                this.filtersView,
                this.gridView,
                this.paginatorView];
        },

        initChildViews: function() {

            this.filtersView = new OffersFiltersView({
                collection: this.collection,
                horizontal: true
            });

            this.gridView = new OffersGridView({
                collection: this.collection
            });

//            this.paginatorView = new ui.paginator.views.PaginatorView({
//                maxPages: 10,
//                collection: this.collection
//            });
        },

        classes: function() {
            return ['offers'];
        },

        render: function() {
            if (this.initialized && this.loader.isLoaded()) {
                this.$el.html(this.template());
                this.$el.attr('class', this.classes().join(' '));
                this.append(this.filtersView, this.contentSelector);
                this.append(this.gridView, this.contentSelector);
                //this.append(this.paginatorView, this.contentSelector);
            }
            return this;
        }
    });

    return {
        OffersFiltersView: OffersFiltersView,
        OffersGridView: OffersGridView,
        EmployerOffersView: EmployerOffersView
    };
});
