define(/** @exports grid/views */[
    'jquery',
    'underscore',
    'core/adapt',
    'core/base',
    'core/factory',
    'core/view',
    'api/query',
    'ui/drop/views',
    'ui/menu/models',
    'ui/menu/views',
    'text!ui/grid/templates/grid.html',
    'text!ui/grid/templates/grid_header_cell.html',
    'text!ui/grid/templates/grid_cell.html',
    'text!ui/grid/templates/grid_link_cell.html',
    'text!ui/grid/templates/grid_action_cell.html'
], function(
    $,
    _,
    adapt,
    base,
    factory,
    view,
    api_query,
    drop_views,
    menu_models,
    menu_views,
    grid_template,
    grid_header_cell_template,
    grid_cell_template,
    grid_link_cell_template,
    grid_action_cell_template) {

    var EVENTS = {
        GRID_ACTION: 'GRID_ACTION_EVENT',
        GRID_SORT: 'GRID_SORT_EVENT'
    };

    var GridHoverCellView = view.View.extend( /** @lends module:grid/views~GridHoverCellView.prototype */ {

        events: {
        },

        childViews: function() {
            return [this.childView];
        },
        
        /**
         * Grid Hover Cell View.
         * @constructs
         * @param {object} options options
         * @param {object} options.config Grid config
         * @param {ApiQuery} options.query Query
         * @param {ApiModel} options.model Model
         * @param {module:core/view~View|module:core/factory~Factory} options.view
         *   View or view factory
         * @augments module:core/view~View
         */
        initialize: function(options) {
            options = _.extend({
                template: ''
            }, options);

            this.template = _.template(options.template);
            this.context = options.context;
            this.config = options.config;
            this.query = options.query;
            this.model = options.model;
            this.viewConfig = options.view;

            //child views
            this.childView = this.createChildView(this.viewConfig);
        },

        classes: function() {
            var result = [
                'grid-hover-cell',
                'grid-hover-cell-' + this.config.column.toLowerCase().replace(' ', '-')
            ];
            return result;
        },

        render: function() {
            var context = _.extend({}, base.getValue(this, 'context', this));
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.childView);
            return this;
        },
        
        createChildView: function(config) {
            var options = _.extend({
                config: this.config,
                query: this.query,
                model: this.model
            }, base.getValue(config, 'options'));

            return new config.ctor(options);
        }
    });

    /**
     * {@link module:core/factory~Factory|Factory} class for convenience.
     */
    GridHoverCellView.Factory = factory.buildFactory(GridHoverCellView);

    /**
     * Grid Header Cell View.
     * @constructor
     * @param {Object} options
     *   config: {Object} grid config (required)
     *   query: {ApiQuery} query (required)
     *   value: {Object} value(required)
     *   sort: {String} collection order_by filter (optional)
     */
    var GridHeaderCellView = view.View.extend({

        tagName: 'th',

        defaultTemplate: grid_header_cell_template,

        events: {
            'click': 'onClick'
        },

        initialize: function(options) {
            options = _.extend(options, {
                template: this.defaultTemplate
            }, options);

            this.template = _.template(options.template);
            this.config = options.config;
            this.context = options.context;
            this.sort = options.sort;
            this.query = options.query;
            this.orderByCollection = this.query.state.orderBys();
            this.sortDirection = this.determineSortDirection();

            if(this.sort) {
                this.listenTo(this.orderByCollection, 'reset', this.render);
            }
        },

        classes: function() {
            var result = [
                'grid-header-cell',
                'grid-header-cell-' + this.config.column.toLowerCase().replace(' ', '-')
            ];
            
            if(this.sort) {
                result.push('grid-header-cell-sort');
            }
            if(this.sortDirection) {
                result.push('grid-header-cell-sort-' + this.sortDirection.toLowerCase());
            }
            return result;
        },

        render: function() {
            this.sortDirection = this.determineSortDirection();

            var context = _.extend({
                column: this.config.column,
                sortDirection: this.sortDirection
            }, base.getValue(this, 'context', this));

            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        },

        determineSortDirection: function() {
            var result;

            var models = this.orderByCollection.where({
                value: this.sort
            });

            if(models.length) {
                result = models[0].direction();
            } else {
                result = null;
            }
            return result;
        },

        onClick: function(e) {
            var orderBy, direction;
            if(this.sort) {
                direction = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
                orderBy = new api_query.ApiQueryOrderBy({
                    value: this.sort,
                    direction: direction
                });
                this.triggerEvent(EVENTS.GRID_SORT, {
                    orderByModel: orderBy
                });
            }
        }
    });

    /**
     * {@link module:core/factory~Factory|Factory} class for convenience.
     */
    GridHeaderCellView.Factory = factory.buildFactory(GridHeaderCellView);

    /**
     * Grid Header Row View.
     * @constructor
     * @param {Object} options
     *   config: {Object} grid config (required)
     *   query: {ApiQuery} query (required)
     */
    var GridHeaderRowView = view.View.extend({

        tagName: 'tr',

        attributes: {
            'class': 'grid-header-row'
        },

        events: {
        },

        initialize: function(options) {
            options = _.extend({
                template: ''
            }, options);
            this.template = _.template(options.template);
            this.context = options.context;
            this.config = options.config;
            this.query = options.query;

            //child views
            this.childViews = [];
            this.initChildViews();
        },

        initChildViews: function() {
            this.destroyChildViews();
            _.each(this.config, this.createCellView, this);
        },

        render: function() {
            var context = _.extend({}, base.getValue(this, 'context', this));
            this.$el.html(this.template(context));
            _.each(this.childViews, function(view) {
                this.append(view);
            }, this);
            return this;
        },

        createCellView: function(cellConfig) {
            var config = _.extend({}, cellConfig);
            config.headerCellView = config.headerCellView ||
                new GridHeaderCellView.Factory();

            var view = config.headerCellView.create({
                config: config,
                query: this.query
            });

            this.childViews.push(view);
        }
    });

    /**
     * {@link module:core/factory~Factory|Factory} class for convenience.
     */
    GridHeaderRowView.Factory = factory.buildFactory(GridHeaderRowView);

    /**
     * Grid Cell View.
     * @constructor
     * @param {Object} options
     *   config: {Object} grid config (required)
     *   model: {ApiModel} model (required)
     *   query: {ApiQuery} query (required)
     *   context: {Object} template context (optional)
     */
    var GridCellView = view.View.extend({

        tagName: 'td',

        defaultTemplate: grid_cell_template,

        events: {
            'mouseenter': 'onMouseEnter',
            'mouseleave': 'onMouseLeave'
        },

        childViews: function() {
            return [this.hoverView];
        },

        initialize: function(options) {
            options = _.extend({
                template: this.defaultTemplate
            }, options);

            this.template = _.template(options.template);
            this.context = options.context;
            this.config = options.config;
            this.model = options.model;
            this.query = options.query;
            this.valueAttribute = options.valueAttribute;
            this.value = options.value;
            this.hoverTimer = null;

            //child views
            this.hoverView = null;
        },

        classes: function() {
            return [
                'grid-cell',
                'grid-cell-' + this.config.column.toLowerCase().replace(' ', '-')
            ];
        },

        defaultContext: function() {
            var getter;
            var current = this.model, fields;
            var result = {
                value: this.value
            };

            if(this.valueAttribute) {
                fields = this.valueAttribute.split('__');
                _.each(_.initial(fields), function(field) {
                    var getter = 'get_' + field;
                    current = current[getter]();
                });
                getter = 'get_' + _.last(fields);
                result.value = current[getter]();
            }
            return result;
        },

        render: function() {
            var context = _.extend(
                    this.defaultContext(),
                    base.getValue(this, 'context', this));

            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        },

        openHoverView: function() {
            var view;

            if(this.config.hoverView && !this.hoverView) {
                view = this.config.hoverView.create({
                    config: this.config,
                    model: this.model,
                    query: this.query
                });

                this.hoverView = new drop_views.DropView({
                    view: view
                });

                this.append(this.hoverView);
            }

            if(this.hoverView) {
                this.hoverView.open();
            }
        },

        onMouseEnter: function(e) {
            if(this.config.hoverView && !this.hoverTimer) {
                this.hoverTimer = setTimeout(
                        _.bind(this.openHoverView, this),
                        1000);
            }
        },

        onMouseLeave: function(e) {
            if(this.hoverTimer) {
                clearTimeout(this.hoverTimer);
                this.hoverTimer = null;
            }
            if(this.hoverView) {
                this.hoverView.close();
            }
        }
    });

    /**
     * {@link module:core/factory~Factory|Factory} class for convenience.
     */
    GridCellView.Factory = factory.buildFactory(GridCellView);

    /**
     * Grid Link Cell View.
     * @constructor
     * @param {Object} options
     *   config: {Object} grid config (required)
     *   model: {ApiModel} model (required)
     *   query: {ApiQuery} query (required)
     *   context: {Object} template context (required)
     */
    var GridLinkCellView = GridCellView.extend({

        initialize: function(options) {
            options = _.extend({
                template: grid_link_cell_template,
                context: {
                    href: options.href
                }}, options);

            GridCellView.prototype.initialize.call(this, options);
        },
        
        classes: function() {
            var result = GridCellView.prototype.classes.call(this);
            result.push('grid-link-cell');
            return result;
        }

    });

    /**
     * {@link module:core/factory~Factory|Factory} class for convenience.
     */
    GridLinkCellView.Factory = factory.buildFactory(GridLinkCellView);

    /**
     * Grid Action Cell View.
     * @constructor
     * @param {Object} options
     *   config: {Object} grid config (required)
     *   model: {ApiModel} model (required)
     *   query: {ApiQuery} query (required)
     *   context: {Object} template context (required)
     */
    var GridActionCellView = GridCellView.extend({

        defaultTemplate: grid_action_cell_template,
        
        events: {
            'click button': 'onToggle',
            'mouseleave': 'onMouseLeave',
            'select .menu': 'onDropMenuSelect'
        },

        childViews: function() {
            return [this.childView];
        },

        initialize: function(options) {
            options = _.extend({
                template: this.defaultTemplate
            }, options);

            GridCellView.prototype.initialize.call(this, options);

            this.menuItemsAdapter = new adapt.ModelCollectionAdapter({
                events: this,
                map: options.map,
                model: this.model,
                adaptedCollection: new menu_models.MenuItemCollection()
            });

            //child views
            this.childView = this.createChildView();
        },
        
        classes: function() {
            var result = GridCellView.prototype.classes.call(this);
            result.push('grid-action-cell');
            return result;
        },

        render: function() {
            GridCellView.prototype.render.call(this);
            this.append(this.childView);
            return this;
        },

        createChildView: function() {
            var collection = this.menuItemsAdapter.adaptedCollection;
            return new menu_views.DropMenuView({
                collection: collection
            });
        },

        onToggle: function(e) {
            this.childView.toggle();
        },

        onMouseLeave: function(e) {
            this.childView.close();
        },

        onDropMenuSelect: function(e, eventBody) {
            var newEventBody = {
                menuItem: eventBody.model,
                model: this.model,
                query: this.query
            };
            e.stopPropagation();
            this.childView.close();
            this.triggerEvent(EVENTS.GRID_ACTION, newEventBody);
        }
    });

    /**
     * {@link module:core/factory~Factory|Factory} class for convenience.
     */
    GridActionCellView.Factory = factory.buildFactory(GridActionCellView);

    /**
     * Grid Row View.
     * @constructor
     * @param {Object} options
     *   config: {Object} grid config (required)
     *   model: {ApiModel} model (required)
     *   query: {ApiQuery} query (required)
     */
    var GridRowView = view.View.extend({

        tagName: 'tr',

        events: {
            'click': 'onRowClick'
        },

        initialize: function(options) {
            options = _.extend({
                template: ''
            }, options);

            this.template = _.template(options.template);
            this.context = options.context;
            this.config = options.config;
            this.model = options.model;
            this.query = options.query;

            //bind events
            this.listenTo(this.model, 'change', this.render);

            //child views
            this.childViews = [];
            this.initChildViews();
        },

        initChildViews: function() {
            this.destroyChildViews();
            _.each(this.config, this.createCellView, this);
        },

        classes: function() {
            return ['grid-row'];
        },

        render: function() {
            var context = base.getValue(this, 'context', this);
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            _.each(this.childViews, function(view) {
                this.append(view);
            }, this);
            return this;
        },

        createCellView: function(cellConfig) {
            var config = _.extend({}, cellConfig);
            config.cellView = config.cellView ||
                new GridCellView.Factory();
            
            var view = config.cellView.create({
                config: config,
                model: this.model,
                query: this.query
            });

            this.childViews.push(view);
            return view;
        },

        onRowClick: function(e) {
        }
    });

    /**
     * {@link module:core/factory~Factory|Factory} class for convenience.
     */
    GridRowView.Factory = factory.buildFactory(GridRowView);

    /**
     * Grid View.
     * @constructor
     * @param {Object} options
     *   config: {Object} config (required)
     *   collection: {ApiCollection} collection (required)
     *   query: {ApiQuery} query (optional)
     */
    var GridView = view.View.extend({

        defaultTemplate: grid_template,

        events: {
            'GRID_ACTION_EVENT': 'onGridAction',
            'GRID_SORT_EVENT': 'onGridSort'
        },
        
        childViews: function() {
            return this.rowViews.concat([this.headerRowView]);
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
            this.query = options.query || this.collection.query();

            //bind events
            this.listenTo(this.collection, 'reset', this.onReset);
            this.listenTo(this.collection ,'add', this.onAdd);
            this.listenTo(this.collection, 'remove', this.onRemove);

            //child views
            this.headerRowView = null;
            this.rowViews = [];
            this.initChildViews();
        },

        initChildViews: function() {
            this.destroyChildViews();

            this.headerRowView = this.createHeaderRow();

            this.rowViews = [];
            this.collection.each(this.createRow, this);
        },

        classes: function() {
            return ['grid'];
        },

        render: function() {
            var context = base.getValue(this, 'context', this);
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            
            this.html(this.headerRowView, 'thead');
            _.each(this.rowViews, function(view) {
                this.append(view, 'tbody');
            }, this);

            return this;
        },

        createHeaderRow: function() {
            var config = _.extend({}, this.config); 

            config.headerRowView = config.headerRowView ||
                new GridHeaderRowView.Factory();

            var view = config.headerRowView.create({
                config: config.columns,
                query: this.query
            });

            return view;
        },

        createRow: function(model) {
            var config = _.extend({}, this.config);
            config.rowView = config.rowView ||
                new GridRowView.Factory();

            var view = config.rowView.create({
                config: config.columns,
                model: model,
                query: this.query
            });

            this.rowViews.push(view);

            return view;
        },

        onReset: function() {
            this.initChildViews();
            this.render();
        },

        onAdd: function(model) {
            var view = this.createRow(model);
            this.append(view, 'tbody');
        },

        onRemove: function(model) {
            this.initChildViews();
            this.render();
        },
        
        onGridAction: function(e, eventBody) {
        },

        onGridSort: function(e, eventBody) {
            var pageSize = 20;
            var orderByModel = eventBody.orderByModel;
            var slice = this.query.state.slice();
            if(slice) {
                pageSize = slice.end() - slice.start();
            }
            this.query.slice(0, pageSize);
            this.query.state.orderBys().reset([orderByModel]);
            this.query.fetch();
        }
    });

    return {
        EVENTS: EVENTS,
        GridView: GridView,
        GridHeaderRowView: GridHeaderRowView,
        GridHeaderCellView: GridHeaderCellView,
        GridRowView: GridRowView,
        GridCellView: GridCellView,
        GridLinkCellView: GridLinkCellView,
        GridActionCellView: GridActionCellView
    };

});
