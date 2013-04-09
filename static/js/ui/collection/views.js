define([
    'jquery',
    'underscore',
    'core/base',
    'core/factory',
    'core/view'
], function(
    $,
    _,
    base,
    factory,
    view) {

    var EVENTS = {
    };

    /**
     * Collection View.
     * @constructor
     * @param {Object} options
     *   collection: {Collection} collection (required)
     */
    var CollectionView = view.View.extend({

        defaultTemplate: '',

        events: {
        },
        
        initialize: function(options) {
            options = _.extend({
                template: this.defaultTemplate
            }, options);

            this.template = _.template(options.template);
            this.context = options.context;
            this.collection = options.collection;
            this.viewFactory = options.viewFactory;
            this.selector = options.selector;
            this.modelViewMap = {};
            
            //bind events
            this.listenTo(this.collection, 'reset', this.onReset);
            this.listenTo(this.collection, 'add', this.onAdd);
            this.listenTo(this.collection, 'remove', this.onRemove);

            //child views
            this.childViews = [];
            this.initChildViews();
        },

        initChildViews: function() {
            this.destroyChildViews();
            this.childViews = [];
            this.modelViewMap = {};

            this.collection.each(this.createChildView, this);
        },

        createChildView: function(model) {
            var view = this.viewFactory.create({
                model: model
            });
            view.$el.addClass(this.childClasses().join(' '));
            view.$el.data('id', model.id || model.cid);
            this.childViews.push(view);
            this.modelViewMap[model.cid] = view;
            return view;
        },

        appendChildView: function(view) {
            this.append(view, this.selector);
        },

        removeChildView: function(view) {
            this.childViews = _.without(view);
            view.destroy();
        },

        classes: function() {
            return ['collection'];
        },

        childClasses: function() {
            return ['item'];
        },

        eventToId: function(e) {
            var currentTarget = this.$(e.currentTarget);
            var id = currentTarget.parents().filter(function() {
                return $.hasData(this) && $(this).data('id');
            }).first().data('id');
            return id;
        },

        render: function() {
            var context = _.extend({
                collection: this.collection.toJSON()
            }, base.getValue(this, 'context', this));

            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));

            _.each(this.childViews, this.appendChildView, this);
            return this;
        },

        onReset: function() {
            this.initChildViews();
            this.render();
        },

        onAdd: function(model) {
            var view = this.createChildView(model);
            this.appendChildView(view);
        },

        onRemove: function(model) {
            var view = this.modelViewMap[model.cid];
            if(view) {
                this.removeChildView(view);
                delete this.modelViewMap[model.cid];
            }
        }

    });

    /**
     * Wrapper View.
     * @constructor
     */
    var WrapperView = view.View.extend({

        initialize: function(options) {
            this.viewFactory = options.viewFactory;
            delete options.viewFactory;
            this.childView = this.createChildView(options);
        },

        childViews: function() {
            return [this.childView];
        },

        createChildView: function(options) {
            var view = this.viewFactory.create(options);
            return view;
        },

        render: function() {
            this.html(this.childView);
            return this;
        }
    });

    /**
     * List Item Wrapper View.
     * @constructor
     */
    var ListItemWrapperView = WrapperView.extend({
        tagName: 'li'
    });

    /**
     * List View.
     * @constructor
     * @param {Object} options
     *   collection: {Collection} collection (required)
     */
    var ListView = CollectionView.extend({

        tagName: 'ul',

        initialize: function(options) {
            options = _.extend({
                wrap: true
            }, options);

            if(options.wrap) {
                var originalViewFactory = options.viewFactory;
                options.viewFactory = new factory.Factory(ListItemWrapperView, {
                    viewFactory: originalViewFactory
                });
            }

            CollectionView.prototype.initialize.call(this, options);
        },

        classes: function() {
            return ['collection-list'];
        }
    });

    return {
        EVENTS: EVENTS,
        CollectionView: CollectionView,
        ListView: ListView
    };
});
