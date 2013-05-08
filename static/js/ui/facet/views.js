define([
    'jquery',
    'underscore',
    'core/base',
    'core/date',
    'core/factory',
    'core/view',
    'events/type',
    'api/facet',
    'api/query',
    'ui/ac/views',
    'ui/collection/views',
    'text!ui/facet/templates/facets.html',
    'text!ui/facet/templates/facet.html',
    'text!ui/facet/templates/auto_facet.html',
    'text!ui/facet/templates/facet_item.html'
], function(
    $,
    _,
    base,
    date,
    factory,
    view,
    events_type,
    api_facet,
    api_query,
    ac_views,
    collection_views,
    facets_template,
    facet_template,
    auto_facet_template,
    facet_item_template) {

    var EventType = {
        OPEN: events_type.EventType.OPEN,
        CLOSE: events_type.EventType.CLOSE,
        FILTER: 'FILTER_EVENT'
    };

    /**
     * Facet View.
     * @constructor
     * @param {object} options
     * @param {string} options.name facet name (i.e. f_skills)
     * @param {string} options.title: facet title (i.e. Skills)
     * @param {Facet} options.model Facet model
     * @param {number} [options.sortOrder=1000] View sort order.
     *   Views with lowest sortOrders will be display at top.
     * @param {boolean} [options.open=true] If true view 
     *   will be opened initially.
     */
    var FacetView = view.View.extend({

        defaultTemplate: facet_template,

        events: {
            'click .header': 'onClick'
        },
        
        initialize: function(options) {
            options = _.extend({
                template: this.defaultTemplate,
                sortOrder: 1000,
                open: true
            }, options);

            this.template = _.template(options.template);
            this.name = options.name;
            this.title = options.title;
            this.model = options.model;
            this.query = options.query;
            this.viewFactory = options.viewFactory;
            this.sortOrder = options.sortOrder;
            
            //child views
            this.facetItemsView = null;
            this.initChildViews();

            if(options.open) {
                this.open();
            }
        },

        childViews: function() {
            return [this.facetItemsView];
        },

        initChildViews: function() {
            this.facetItemsView = new collection_views.ListView({
                viewFactory: this.viewFactory,
                collection: this.model.items()
            });
        },

        render: function() {
            var context = this.context();

            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.facetItemsView, '.facet-items');
            return this;
        },

        context: function() {
            return {
                name: this.name,
                title: this.title
            };
        },

        classes: function() {
            var result= [
                'facet',
                'facet-' + this.name.toLowerCase().replace(' ', '-')
            ];

            if(this.isOpen()) {
                result.push('facet-open');
            }
            return result;
        },

        isOpen: function() {
            return this.$el.hasClass('facet-open');
        },

        open: function() {
            if(!this.isOpen()) {
                this.$el.addClass('facet-open');
                this.triggerEvent(events_type.EventType.OPEN, {
                    view: this
                });
            }
        },

        close: function() {
            if(this.isOpen()) {
                this.$el.removeClass('facet-open');
                this.triggerEvent(events_type.EventType.CLOSE, {
                    view: this
                });
            }
        },

        toggle: function() {
            if(this.isOpen()) {
                this.close();
            } else {
                this.open();
            }
        },

        onClick: function(e) {
            this.toggle();
        }
    });

    FacetView.Factory = factory.buildFactory(FacetView);

    /**
     * Auto Facet View.
     * @constructor
     * @param {object} options
     * @param {string} options.name facet name (i.e. f_skills)
     * @param {string} options.title: facet title (i.e. Skills)
     * @param {Facet} options.model Facet model
     * @param {Matcher) options.matcher Autocomplete matcher
     * @param {string} [options.placeholder] Input placeholder text
     * @param {number} [options.sortOrder=1000] View sort order.
     *   Views with lowest sortOrders will be display at top.
     * @param {boolean} [options.open=true] If true view 
     *   will be opened initially.
     */
    var AutoFacetView = FacetView.extend({

        defaultTemplate: auto_facet_template,

        events: _.extend({
            'select .autocomplete': 'onSelect',
            'click .add': 'onClickAdd'

        }, FacetView.prototype.events),

        initialize: function(options) {
            this.matcher = options.matcher;
            this.placeholder = options.placeholder || '';

            //child views
            this.acView = null;

            //create facet items for filters which were added through
            //autocomplete and will not be returned from the server.
            this._createFacetItems();
            
            FacetView.prototype.initialize.call(this, options);
        },
        
        childViews: function() {
            result = FacetView.prototype.childViews.call(this);
            return result;
        },


        initChildViews: function() {
            FacetView.prototype.initChildViews.call(this);

            this.acView = new ac_views.AutoCompleteView({
                inputView: this,
                inputSelector: '.auto-facet-input',
                matcher: this.matcher
            });
        },

        render: function() {
            FacetView.prototype.render.call(this);
            this.append(this.acView);
            return this;
        },

        context: function() {
            var result = FacetView.prototype.context.call(this);
            result.placeholder = this.placeholder;
            return result;
        },

        classes: function() {
            var result = FacetView.prototype.classes.call(this);
            result.push('auto-facet');
            return result;
        },

        onSelect: function(e, eventBody) {
            var enable_filter, disable_filter;
            var value = eventBody.value;
            var filter = api_query.ApiQueryFilter.parse(this.model.filter());
            var facetItem = this.model.items().get(value);

            this.acView.clear();
            if(facetItem && facetItem.enabled()) {
                return;
            }

            if(filter.value()) {
                enable_filter = filter.setValue(filter.value() + ',' + value);
            } else {
                enable_filter = filter.setValue(value);
            }

            this.triggerEvent(EventType.FILTER, {
                filter: filter
            });
        },

        onClickAdd: function(e) {
            //prevent url from changing to '#'
            e.preventDefault();

            this.$el.addClass('show-auto');
            this.$('.auto-facet-input').focus();
        },

        _createFacetItems: function() {
            var filter = api_query.ApiQueryFilter.parse(this.model.filter());
            var values = filter.value();
            if(!values) {
                return;
            }

            values = values.split(',');
            _.each(values, function(value) {
                if(!this.model.items().get(value)) {
                    var disableFilter = filter.clone().setValue(
                        _.without(values, value).join(','));
                    this.model.items().add({
                        name: value,
                        enabled: true,
                        disable_filter: disableFilter
                    });
                }
            }, this);
        }
    });

    AutoFacetView.Factory = factory.buildFactory(AutoFacetView);

    /**
     * Facet Item View.
     * @constructor
     * @param {object} options
     * @param {FacetItem} options.model FacetItem model
     */
    var FacetItemView = view.View.extend({

        defaultTemplate: facet_item_template,

        events: {
            'click input': 'onClick'
        },
        
        initialize: function(options) {
            this.template = _.template(this.defaultTemplate);
            this.model = options.model;
        },

        classes: function() {
            return ['facet-item'];
        },

        render: function() {
            var context = this.model.toJSON();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        },

        onClick: function(e) {
            var input = this.$(e.currentTarget);
            var checked = input.prop('checked');

            if(checked) {
                this.triggerEvent(EventType.FILTER, {
                    filter: this.model.enable_filter()
                });
            } else {
                this.triggerEvent(EventType.FILTER, {
                    filter: this.model.disable_filter()
                });
            }
        }
    });

    FacetItemView.Factory = factory.buildFactory(FacetItemView);


    /**
     * Facets View.
     * @constructor
     * @param {object} options
     * @param {object} options.config: Facet config
     * @param {ApiCollection} options.collection collection
     * @param {ApiQuery} options.query ApiQuery query
     * @param {boolean} [options.includeAll=true] Set to true to
     *   include all facet views, even those not explicitly
     *   configured.
     */
    var FacetsView = collection_views.ListView.extend({

        defaultTemplate: facets_template,

        events: {
            'FILTER_EVENT': 'onFilter'
        },
        
        initialize: function(options) {
            options = _.extend({
                template: this.defaultTemplate,
                includeAll: false,
                viewFactory: new factory.FunctionFactory(
                    _.bind(this.createFacetView, this)),
                sort: function(facetView) {
                    return facetView.sortOrder;
                }

            }, options);

            this.config = options.config;
            this.query = options.query;
            this.includeAll = options.includeAll;
            this.facetConfigMap = {};
            this.facetViewFactory = new FacetView.Factory();
            this.facetItemViewFactory = new FacetItemView.Factory();
            
            //create facet config map (name => config)
            //and add sortOrder to configs to ensure
            //facets views are rendered in order
            var sortOrder = 1;
            _.each(this.config.facets, function(config) {
                config.sortOrder = sortOrder++;
                this.facetConfigMap[config.name] = config;
            }, this);

            collection_views.ListView.prototype.initialize.call(this, options);
        },

        classes: function() {
            return ['facets'];
        },

        createFacetView: function(options) {
            var view = null;
            var facetConfig = this.facetConfigMap[options.model.name()];

            if(this.includeAll && !facetConfig) {
                facetConfig = {};
            }

            if(facetConfig) { 
                var title = facetConfig.title || 
                    options.model.title();
                var facetViewFactory = facetConfig.facetView ||
                    this.facetViewFactory;
                var facetItemViewFactory = facetConfig.facetItemView ||
                    this.facetItemViewFactory;
                
                view = facetViewFactory.create({
                    name: options.model.name(),
                    title: title,
                    model: options.model,
                    query: this.query,
                    viewFactory: facetItemViewFactory,
                    sortOrder: facetConfig.sortOrder || 1000,
                    open: facetConfig.open || true
                });
            }

            return view;
        },

        onReset: function() {
            //save facet state
            var facetStateMap = {};
            _.each(this.childViews, function(view) {
                var facetView = view.childView;
                facetStateMap[facetView.model.name()] = facetView.isOpen();
            }, this);

            //create new facet views
            this.initChildViews();

            //apply facet state
            _.each(this.childViews, function(view) {
                var facetView = view.childView;
                var isOpen = facetStateMap[facetView.model.name()];
                if(isOpen === true) {
                    facetView.open();
                } else if(isOpen === false) {
                    facetView.close();
                }
            }, this);

            this.render();
        },

        onFilter: function(e, eventBody) {
            this._applyFilter(eventBody.filter);
        },

        _applyFilter: function(filter) {
            if(_.isString(filter)) {
                filter = api_query.ApiQueryFilter.parse(filter);
            }
            var filters = this.query.state.filters();
            filters.remove(filters.getFilters(filter.name()));
            filters.add(filter);

            var pageSize = 20;
            var slice = this.query.state.slice();
            if(slice) {
                pageSize = slice.end() - slice.start();
            }
            this.query.slice(0, pageSize).fetch();
        }
    });

    return {
        EventType: EventType,
        FacetsView: FacetsView,
        FacetView: FacetView,
        AutoFacetView: AutoFacetView
    };

});
