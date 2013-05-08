define([
    'jquery',
    'underscore',
    'core/base',
    'core/date',
    'core/factory',
    'core/view',
    'api/query',
    'ui/date/views',
    'ui/drop/views',
    'ui/filter/models',
    'ui/select/models',
    'ui/select/views',
    'text!ui/filter/templates/filters.html',
    'text!ui/filter/templates/filter.html',
    'text!ui/filter/templates/filter_factory.html',
    'text!ui/filter/templates/filter_factory_drop.html'

], function(
    $,
    _,
    base,
    date,
    factory,
    view,
    api_query,
    date_views,
    drop_views,
    filter_models,
    select_models,
    select_views,
    filters_template,
    filter_template,
    filter_factory_template,
    filter_factory_drop_template) {

    var EVENTS = {
        FILTER_VIEW_CREATE: 'FILTER_VIEW_CREATE_EVENT',
        FILTER_VIEW_DESTROY: 'FILTER_VIEW_DESTROY_EVENT',
        FILTER_APPLY: 'FILTER_APPLY_EVENT'
    };

    /**
     * Filter View.
     * @constructor
     * @param {Object} options
     *   collection: {ApiCollection} collection (required)
     *   query: {ApiQuery} query (required)
     */
    var FilterView = view.View.extend({

        defaultTemplate: filter_template,

        events: {
            'click .drop-button': 'onToggle',
            'click .filter-close': 'onClose',
            'open .drop': '_onDropOpened',
            'close .drop': '_onDropClosed'
        },
        
        childViews: function() {
            return [this.dropView];
        },

        initialize: function(options) {
            this.template = _.template(this.defaultTemplate);
            this.collection = options.collection;
            this.name = options.name;
            this.field = options.field;
            this.query = options.query;
            this.view = options.view;
            
            //child views
            this.dropView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.dropView = new drop_views.DropView({
                autocloseGroup: 'filter',
                view: this.view
            });
        },

        render: function() {
            var context = {
                name: this.name,
                title: this.title()
            };

            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.dropView);
            
            return this;
        },

        classes: function() {
            return [
                'filter',
                'filter-' + this.name.toLowerCase().replace(' ', '-')
            ];
        },

        getSubview: function() {
            return this.dropView.childView;
        },

        filters: function(name, op) {
            var result;
            var filterCollection = this.query.state.filters();
            if(op) {
                result  = filterCollection.where({name: name, op: op});
            } else {
                result = filterCollection.where({name: name});
            }
            return result;
        },

        title: function() {
        },

        updateTitle: function() {
            this.$('.filter-wrap-title').text(this.title());
        },

        onFilterOpened: function() {
        },

        onFilterClosed: function() {
        },

        onToggle: function(e) {
            this.dropView.toggle();
        },

        onClose: function(e) {
            this.triggerEvent(EVENTS.FILTER_VIEW_DESTROY, {
                field: this.field
            });
        },

        _onDropOpened: function(e, eventBody) {
            if(eventBody.view === this.dropView) {
                this.onFilterOpened();
            }
        },

        _onDropClosed: function(e, eventBody) {
            if(eventBody.view === this.dropView) {
                this.onFilterClosed();
            }
        }
    });

    /**
     * Select Filter View.
     * @constructor
     * @param {Object} options
     *   collection: {ApiCollection} collection (required)
     *   query: {ApiQuery} query (required)
     *   field: {String} (required)
     *   selections: {Array} of selections
     */
    var SelectFilterView = FilterView.extend({

        initialize: function(options) {
            this.selections = options.selections;
            this.selectionCollection = new select_models.SelectionCollection();
            this.filterToSelection = options.filterToSelection || this.passThrough;
            this.selectionToFilter = options.selectionToFilter || this.passThrough;
            
            var view = new select_views.MultiSelectView({
                collection: this.selectionCollection
            });

            options = _.extend({
                view: view
            }, options);

            FilterView.prototype.initialize.call(this, options);
            this.selectionCollection.reset(this.filterToSelectionModels());

            this.listenTo(this.selectionCollection, 'change:selected', this.onSelected);
        },

        title: function() {
            var result = 'ALL';
            filter = _.first(this.filters(this.field, 'in'));
            if(filter) {
                result = this.filterToSelection(filter.value());
            }
            return result;
        },

        passThrough: function(value) {
            return value;
        },

        filterToSelectionModels: function() {
            var models, filter, selected = [];

            filter = _.first(this.filters(this.field, 'in'));
            if(filter) {
                selected = _.map(filter.value().split(','), this.filterToSelection);
            }

            if(this.selections) {
                models = _.map(this.selections, function(selection) {
                    return new select_models.Selection({
                        value: selection,
                        selected: _.contains(selected, selection)
                    });
                }, this);
            } else {
                models = _.map(selected, function(value) {
                    return new select_models.Selection({
                        value: value,
                        selected: true
                    });
                });
            }

            return models;
        },

        selectionCollectionToFilter: function() {
            var filter = null;
            var selected = this.selectionCollection.where({selected: true});
            var values = _.map(selected, function(model) {
                return model.value();
            }, this);
            
            if(values.length) {
                filter = new api_query.ApiQueryFilter({
                    name: this.field,
                    value: _.map(values, this.selectionToFilter).join(','),
                    op: 'in'
                });
            }
            return filter;
        },

        onSelected: function(selectionModel) {
            this.query.state.filters().remove(this.filters(this.field, 'in'));
            var filters = this.query.state.filters();
            var filter = this.selectionCollectionToFilter();

            filters.remove(filters.where({name: this.field}));
            if(filter) {
                this.query.state.filters().add(filter);
            } 

            this.updateTitle();

            this.triggerEvent(EVENTS.FILTER_APPLY, {
                field: this.field
            });
        }

    });

    SelectFilterView.Factory = factory.buildFactory(SelectFilterView);

    /**
     * Auto Select Filter View.
     * @constructor
     * @param {Object} options
     *   collection: {ApiCollection} collection (required)
     *   query: {ApiQuery} query (required)
     *   field: {String} (required)
     *   choices: {Array} of choices
     */
    var AutoSelectFilterView = SelectFilterView.extend({

        initialize: function(options) {
            this.selectionCollection = new select_models.SelectionCollection();
            this.filterToSelection = options.filterToSelection || this.passThrough;
            this.selectionToFilter = options.selectionToFilter || this.passThrough;
            
            var view = new select_views.AutoMultiSelectView({
                collection: this.selectionCollection,
                matcher: options.matcher,
                inputPlaceholder: options.inputPlaceholder || 'search'
            });
            
            options = _.extend({
                view: view
            }, options);

            FilterView.prototype.initialize.call(this, options);

            this.selectionCollection.reset(this.filterToSelectionModels());
            this.listenTo(this.selectionCollection, 'change:selected', this.onSelected);
        },

        onFilterOpened: function() {
            this.dropView.childView.refresh();
            this.dropView.childView.input().focus();
        }

    });

    AutoSelectFilterView.Factory = factory.buildFactory(AutoSelectFilterView);

    /**
     * Date Range Filter View.
     * @constructor
     * @param {Object} options
     *   collection: {ApiCollection} collection (required)
     *   query: {ApiQuery} query (required)
     *   field: {String} (required)
     */
    var DateRangeFilterView = FilterView.extend({

        events: function() {
            var result = _.extend({
            }, _.result(FilterView.prototype, 'events'));
            result[date_views.EVENTS.DATE_RANGE_CHANGED] = 'onDateRangeChanged';
            return result;
        },

        initialize: function(options) {
            options = _.extend({
                view: new date_views.DateRangeView()
            }, options);

            FilterView.prototype.initialize.call(this, options);
            
            var range = this.filterToDateRange(this.getFilter());
            if(range) {
                this.getSubview().setDateRange(range);
            }
        },

        title: function() {
            var range, result = 'ALL';
            filter = this.getFilter();
            if(filter) {
                range = this.filterToDateRange(filter);

                if(date.DateRange.allTime().equals(range)) {
                    result = 'ALL';
                } else if(date.DateRange.today().equals(range)) {
                    result = 'Today';
                } else if(date.DateRange.thisWeek().equals(range)) {
                    result = 'This week';
                } else if(date.DateRange.thisMonth().equals(range)) {
                    result = 'This month';
                } else {
                    result = range.start.format('MM/dd/yy') + '-' + range.end.format('MM/dd/yy');
                }
            }
            return result;
        },

        filterToDateRange: function(filter) {
            var start, end, values, result;
            if(filter) {
                values = filter.value().split(':');
                start = date.Date.fromTimestamp(parseFloat(values[0]));
                end = date.Date.fromTimestamp(parseFloat(values[1]));
                result =new date.DateRange(start, end);
            }
            return result;
        },

        dateRangeToFilter: function(range) {
            var result, start, end, values;
            if(range && range.start && range.end) {
                start = new date.DateTime(range.start.date);
                end = new date.DateTime(range.end.date).add(
                        new date.Interval(0, 0, 0, 23, 59, 59));
                values = [start.getTimestamp(), end.getTimestamp()];
                result = new api_query.ApiQueryFilter({
                    name: this.field,
                    value: values.join(':'),
                    op: 'range'
                });
            }
            return result;
        },

        getFilter: function() {
            return _.first(this.filters(this.field, 'range'));
        },

        setFilter: function(filter) {
            var filters = this.query.state.filters();
            filters.remove(filters.where({name: this.field}));
            if(filter) {
                this.query.state.filters().add(filter);
            } 
            this.updateTitle();
        },

        onDateRangeChanged: function(e, eventBody) {
            var range = eventBody.dateRange;
            if(date.DateRange.allTime().equals(range)) {
                this.setFilter(null);
            } else if(range.start && range.end) {
                this.setFilter(this.dateRangeToFilter(range));
            }

            this.triggerEvent(EVENTS.FILTER_APPLY, {
                field: this.field
            });
        }
    });

    DateRangeFilterView.Factory = factory.buildFactory(DateRangeFilterView);

    /**
     * Filter Factory View.
     * @constructor
     * @param {Object} options
     *   config: Filters config (required)
     *   collection: {FilterViewCollection} collection (required)
     */
    var FilterFactoryView = view.View.extend({

        defaultTemplate: filter_factory_template,

        events: {
            'click .drop-button': 'onToggle'
        },
        
        childViews: function() {
            return [this.dropView];
        },

        initialize: function(options) {
            this.template = _.template(this.defaultTemplate);
            this.config = options.config;
            this.collection = options.collection;
            this.filterConfigMap = {};
            this.selectionCollection = new select_models.SelectionCollection(
                this.configToSelectionModels()
            );

            _.each(this.config.filters, function(config) {
                this.filterConfigMap[config.name] = config;
            }, this);

            //bind events
            this.listenTo(this.collection, 'reset add remove', this.onFilterViewUpdate);
            this.listenTo(this.selectionCollection, 'change:selected', this.onSelected);
            
            //child views
            this.dropView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            var view = new factory.Factory(select_views.MultiSelectView, {
                collection: this.selectionCollection
            });

            this.dropView = new drop_views.DropView({
                autocloseGroup: 'filter',
                view: view
            });
        },

        render: function() {
            this.$el.html(this.template());
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.dropView);
            return this;
        },

        classes: function() {
            return ['filter-factory'];
        },

        configToSelectionModels: function() {
            var selected = this.collection.pluck('field');
            var models = _.map(this.config.filters, function(filterConfig) {
                return new select_models.Selection({
                    value: filterConfig.name,
                    selected: _.contains(selected, filterConfig.field)
                });
            }, this);
            return models;
        },

        onFilterViewUpdate: function(model) {
            this.selectionCollection.reset(this.configToSelectionModels());
        },

        onSelected: function(model) {
            var filterConfig = this.filterConfigMap[model.value()];
            if(model.selected()) {
                this.triggerEvent(EVENTS.FILTER_VIEW_CREATE, {
                    field: filterConfig.field
                });
            } else {
                this.triggerEvent(EVENTS.FILTER_VIEW_DESTROY, {
                    field: filterConfig.field
                });
            }
        },

        onToggle: function(e) {
            this.dropView.toggle();
        }
    });

    /**
     * Filters View.
     * @constructor
     * @param {Object} options
     *   config: {Object} config (required)
     *   collection: {ApiCollection} collection (required)
     *   query: {ApiQuery} query (required)
     *   horizontal: {Boolean} (optional)
     */
    var FiltersView = view.View.extend({

        defaultTemplate: filters_template,

        events: {
            'FILTER_VIEW_CREATE_EVENT': 'onFilterViewCreate',
            'FILTER_VIEW_DESTROY_EVENT': 'onFilterViewDestroy',
            'FILTER_APPLY_EVENT': 'onFilterApply'
        },
        
        childViews: function() {
            var result = [this.factoryView];
            result = result.concat(this.filterViews.pluck('view'));
            return result;
        },


        initialize: function(options) {
            options = _.extend({
                template: this.defaultTemplate,
                context: {}
            }, options);

            this.template = _.template(options.template);
            this.context = options.context;
            this.config = options.config;
            this.collection = options.collection;
            this.query = options.query;
            this.horizontal = options.horizontal || false;
            this.filterConfigMap = {};

            _.each(this.config.filters, function(config) {
                this.filterConfigMap[config.field] = config;
            }, this);


            //child views
            this.filterViews = new filter_models.FilterViewCollection();
            this.factoryView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.createFilterViews();
            this.factoryView = new FilterFactoryView({
                config: this.config,
                collection: this.filterViews
            });
        },

        classes: function() {
            var result = ['filters'];
            if(this.horizontal) {
                result.push('horizontal');
            }
            return result;
        },

        render: function() {
            var context = base.getValue(this, 'context', this);
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));

            this.append(this.factoryView);

            _.each(this.filterViews.pluck('view'), function(view) {
                this.append(view);
            }, this);

            return this;
        },

        createFilterViews: function() {
            var result;
            var fields = _.uniq(this.query.state.filters().pluck('name'));
            result = _.map(fields, function(field) {
                return this.createFilterView(field);
            }, this);
            return result;
        },

        createFilterView: function(field) {
            var filterConfig = this.filterConfigMap[field];
            var view = filterConfig.filterView.create({
                name: filterConfig.name,
                field: filterConfig.field,
                collection: this.colleciton,
                query: this.query
            });

            this.filterViews.add({
                field: field,
                view: view
            });

            return view;
        },

        destroyFilterView: function(field) {
            var filterViewModel = this.filterViews.get(field);
            var filters = this.query.state.filters();
            
            if(view) {
                filterViewModel.view().destroy();
                filters.remove(filters.where({name: field}));
                this.filterViews.remove(
                    this.filterViews.where({field: field})
                );
                this.filter();
            }
        },

        filter: function() {
            var pageSize = 20;
            var slice = this.query.state.slice();
            if(slice) {
                pageSize = slice.end() - slice.start();
            }
            this.query.slice(0, pageSize).fetch();
        },

        onFilterViewCreate: function(e, eventBody) {
            var view = this.createFilterView(eventBody.field);
            this.append(view);
        },

        onFilterViewDestroy: function(e, eventBody) {
            this.destroyFilterView(eventBody.field);
        },

        onFilterApply: function(e, eventBody) {
            this.filter();
        }

    });

    return {
        EVENTS: EVENTS,
        FiltersView: FiltersView,
        SelectFilterView: SelectFilterView,
        AutoSelectFilterView: AutoSelectFilterView,
        DateRangeFilterView: DateRangeFilterView
    };

});
