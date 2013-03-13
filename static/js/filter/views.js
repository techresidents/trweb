define([
    'jquery',
    'underscore',
    'core/base',
    'core/date',
    'core/view',
    'api/query',
    'choices/models',
    'choices/views',
    'date/views',
    'drop/views',
    'filter/models',
    'text!filter/templates/filters.html',
    'text!filter/templates/filter.html',
    'text!filter/templates/filter_factory.html',
    'text!filter/templates/filter_factory_drop.html'

], function(
    $,
    _,
    base,
    date,
    view,
    api_query,
    choices_models,
    choices_views,
    date_views,
    drop_views,
    filter_models,
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
            'click .filter-close': 'onClose'
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
            this.viewConfig = options.viewConfig;

            //child views
            this.dropView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            var viewOptions = _.extend({
                collection: this.collection,
                query: this.query
            }, _.result(this.viewConfig, 'options')); 

            this.dropView = new drop_views.DropView({
                autocloseGroup: 'filter',
                view: {
                    ctor: this.viewConfig.ctor,
                    options: viewOptions
                }
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

        onToggle: function(e) {
            this.dropView.toggle();
        },

        onClose: function(e) {
            this.triggerEvent(EVENTS.FILTER_VIEW_DESTROY, {
                field: this.field
            });
        }
    });

    /**
     * Choices Filter View.
     * @constructor
     * @param {Object} options
     *   collection: {ApiCollection} collection (required)
     *   query: {ApiQuery} query (required)
     *   field: {String} (required)
     *   choices: {Array} of choices
     */
    var ChoicesFilterView = FilterView.extend({

        initialize: function(options) {
            this.choices = options.choices;
            this.choiceCollection = new choices_models.ChoiceCollection();

            options = _.extend({
                viewConfig: {
                    ctor: choices_views.ChoicesView,
                    options: {
                        collection: this.choiceCollection
                    }
                }
            }, options);

            FilterView.prototype.initialize.call(this, options);
            this.choiceCollection.reset(this.filterToChoiceModels());

            this.listenTo(this.choiceCollection, 'change:selected', this.onSelected);
        },

        title: function() {
            var result = 'ALL';
            filter = _.first(this.filters(this.field, 'in'));
            if(filter) {
                result = filter.value();
            }
            return result;
        },

        filterToChoiceModels: function() {
            var models, filter, selected = [];

            filter = _.first(this.filters(this.field, 'in'));
            if(filter) {
                selected = filter.value().split(',');
            }
            models = _.map(this.choices, function(choice) {
                return new choices_models.Choice({
                    value: choice,
                    selected: _.contains(selected, choice)
                });
            }, this);

            return models;
        },

        choiceCollectionToFilter: function() {
            var filter = null;
            var selected = this.choiceCollection.where({selected: true});
            var values = _.map(selected, function(model) {
                return model.value();
            }, this);
            
            if(values.length) {
                filter = new api_query.ApiQueryFilter({
                    name: this.field,
                    value: values.join(','),
                    op: 'in'
                });
            }
            return filter;
        },

        onSelected: function(choiceModel) {
            this.query.state.filters().remove(this.filters(this.field, 'in'));
            var filters = this.query.state.filters();
            var filter = this.choiceCollectionToFilter();

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
                viewConfig: {
                    ctor: date_views.DateRangeView,
                    options: {}
                }
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
                values = filter.value().split(',');
                start = date.Date.fromTimestamp(parseFloat(values[0]));
                end = date.Date.fromTimestamp(parseFloat(values[1]));
                result =new date.DateRange(start, end);
            }
            return result;
        },

        dateRangeToFilter: function(range) {
            var result, values;
            if(range && range.start && range.end) {
                values = [range.start.getTime() / 1000.0, range.end.getTime() / 1000.0];
                result = new api_query.ApiQueryFilter({
                    name: this.field,
                    value: values.join(','),
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
            this.choiceCollection = new choices_models.ChoiceCollection(
                this.configToChoiceModels()
            );

            _.each(this.config.filters, function(config) {
                this.filterConfigMap[config.name] = config;
            }, this);

            //bind events
            this.listenTo(this.collection, 'reset add remove', this.onFilterViewUpdate);
            this.listenTo(this.choiceCollection, 'change:selected', this.onSelected);
            
            //child views
            this.dropView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.dropView = new drop_views.DropView({
                autocloseGroup: 'filter',
                view: {
                    ctor: choices_views.ChoicesView,
                    options: {
                        collection: this.choiceCollection
                    }
                }
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

        configToChoiceModels: function() {
            var selected = this.collection.pluck('field');
            var models = _.map(this.config.filters, function(filterConfig) {
                return new choices_models.Choice({
                    value: filterConfig.name,
                    selected: _.contains(selected, filterConfig.field)
                });
            }, this);
            return models;
        },

        onFilterViewUpdate: function(model) {
            this.choiceCollection.reset(this.configToChoiceModels());
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
            var name = filterConfig.name;
            var ctor = filterConfig.filterView.ctor;
            var options = _.extend({
                name: name,
                field: field,
                collection: this.collection,
                query: this.query
            }, _.result(filterConfig.filterView, 'options'));

            var view = new ctor(options);

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
        ChoicesFilterView: ChoicesFilterView,
        DateRangeFilterView: DateRangeFilterView
    };

});
