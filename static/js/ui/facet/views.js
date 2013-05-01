define([
    'jquery',
    'underscore',
    'core/base',
    'core/date',
    'core/factory',
    'core/view',
    'events/type',
    'api/query',
    'ui/collection/views',
    'text!ui/facet/templates/facets.html',
    'text!ui/facet/templates/facet.html',
    'text!ui/facet/templates/facet_item.html'
], function(
    $,
    _,
    base,
    date,
    factory,
    view,
    events_type,
    api_query,
    collection_views,
    facets_template,
    facet_template,
    facet_item_template) {

    var EVENTS = {
        FACET_OPEN: events_type.EventType.OPEN,
        FACET_CLOSE: events_type.EventType.CLOSE,
        FACET_ENABLE: 'FACET_ENABLE_EVENT',
        FACET_DISABLE: 'FACET_DISABLE_EVENT'
    };

    /**
     * Facet View.
     * @constructor
     * @param {Object} options
     *   name: {string} name Facet name
     *   title: {string} name Facet title
     *   model: {Facet} model Facet model
     */
    var FacetView = view.View.extend({

        defaultTemplate: facet_template,

        events: {
            'click .header': 'onClick'
        },
        
        childViews: function() {
            return [this.facetItemsView];
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
            this.viewFactory = options.viewFactory;
            this.sortOrder = options.sortOrder;
            
            //child views
            this.facetItemsView = null;
            this.initChildViews();

            if(options.open) {
                this.open();
            }
        },

        initChildViews: function() {
            this.facetItemsView = new collection_views.ListView({
                viewFactory: this.viewFactory,
                collection: this.model.items()
            });
        },

        render: function() {
            var context = {
                name: this.name,
                title: this.title
            };

            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.facetItemsView, '.facet-items');
            return this;
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
     * Facet Item View.
     * @constructor
     * @param {Object} options
     *   model: {FacetItem} model FacetItem model
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
                this.triggerEvent(EVENTS.FACET_ENABLE, {
                    facetItem: this.model
                });
            } else {
                this.triggerEvent(EVENTS.FACET_DISABLE, {
                    facetItem: this.model
                });
            }
        }
    });

    FacetItemView.Factory = factory.buildFactory(FacetItemView);


    /**
     * Facets View.
     * @constructor
     * @param {Object} options
     *   config: {Object} config (required)
     *   collection: {ApiCollection} collection (required)
     *   query: {ApiQuery} query (required)
     */
    var FacetsView = collection_views.ListView.extend({

        defaultTemplate: facets_template,

        events: {
            'FACET_ENABLE_EVENT': 'onEnableFacet',
            'FACET_DISABLE_EVENT': 'onDisableFacet'
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

        onEnableFacet: function(e, eventBody) {
            var filter = eventBody.facetItem.on_filter();
            this._applyFilter(filter);
        },

        onDisableFacet: function(e, eventBody) {
            var filter = eventBody.facetItem.off_filter();
            this._applyFilter(filter);
        },

        _applyFilter: function(filterString) {
            var filter = api_query.ApiQueryFilter.parse(filterString);
            this.query.state.filters().remove(filter.name());
            this.query.state.filters().add(filter);

            var pageSize = 20;
            var slice = this.query.state.slice();
            if(slice) {
                pageSize = slice.end() - slice.start();
            }
            this.query.slice(0, pageSize).fetch();
        }
    });

    return {
        EVENTS: EVENTS,
        FacetsView: FacetsView
    };

});
