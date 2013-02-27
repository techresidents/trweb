define([
    'jquery',
    'underscore',
    'core/base',
    'core/view',
    'api/query',
    'drop/views',
    'text!grid/templates/grid.html',
    'text!grid/templates/grid_header_cell.html',
    'text!grid/templates/grid_cell.html',
    'text!grid/templates/grid_link_cell.html',
    'text!grid/templates/grid_action_cell.html'
], function(
    $,
    _,
    base,
    view,
    api_query,
    drop_views,
    grid_template,
    grid_header_cell_template,
    grid_cell_template,
    grid_link_cell_template,
    grid_action_cell_template) {

    var EVENTS = {
        GRID_ACTION: 'GRID_ACTION_EVENT',
        GRID_SORT: 'GRID_SORT_EVENT'
    };


    /**
     * Grid Hover Cell View.
     * @constructor
     * @param {Object} options
     *   config: {Object} grid config (required)
     *   query: {ApiQuery} query (required)
     *   model: {ApiModel} model (required)
     *   view: {Object} view options (required) 
     */
    var GridHoverCellView = view.View.extend({

        events: {
        },

        childViews: function() {
            return [this.childView];
        },

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
            var config = _.extend({
                headerCellView: {}
            }, cellConfig);

            var ctor = config.headerCellView.ctor || GridHeaderCellView;

            var options = _.extend({
                config: config,
                query: this.query
            }, base.getValue(config.headerCellView, 'options', this));

            var view = new ctor(options);
            this.childViews.push(view);
        }
    });

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
            if(this.config.hoverView && !this.hoverView) {
                this.hoverView = new drop_views.DropView({
                    view: {
                        ctor: GridHoverCellView,
                        options: {
                            config: this.config,
                            model: this.model,
                            query: this.query,
                            view: this.config.hoverView
                        }
                    }
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
            'DROP_MENU_SELECTED_EVENT': 'onDropMenuSelected'
        },

        childViews: function() {
            return [this.childView];
        },

        initialize: function(options) {
            options = _.extend({
                template: this.defaultTemplate
            }, options);

            GridCellView.prototype.initialize.call(this, options);

            this.actions = options.actions;

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
            return new drop_views.DropMenuView({
                items: this.actions
            });
        },

        onToggle: function(e) {
            this.childView.toggle();
        },

        onMouseLeave: function(e) {
            this.childView.close();
        },

        onDropMenuSelected: function(e, item) {
            var eventBody = {
                action: item,
                model: this.model,
                query: this.query
            };
            e.stopPropagation();
            this.triggerEvent(EVENTS.GRID_ACTION, eventBody);
        }
    });

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
            var config = _.extend({
                cellView: {
                    ctor: GridCellView
                }
            }, cellConfig);

            var ctor = config.cellView.ctor || GridCellView;

            var options = _.extend({
                config: config,
                model: this.model,
                query: this.query
            }, base.getValue(config.cellView, 'options', this.model));
            
            var view = new ctor(options);

            this.childViews.push(view);
            return view;
        },

        onRowClick: function(e) {
        }
    });

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
            var config = _.extend({
                headerRowView: {
                    ctor: GridHeaderRowView
                }
            }, this.config);

            var ctor = config.headerRowView.ctor || GridHeaderRowView;

            var options = _.extend({
                config: config.columns,
                query: this.query
            }, base.getValue(config.headerRowView, 'options', this));

            var view = new ctor(options);

            return view;
        },

        createRow: function(model) {
            var config = _.extend({
                rowView: {
                    ctor: GridRowView
                }
            }, this.config);

            var ctor = config.rowView.ctor || GridRowView;
        
            var options = _.extend({
                config: config.columns,
                model: model,
                query: this.query
            }, base.getValue(config.rowView, 'options', model));

            var view = new ctor(options);
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
