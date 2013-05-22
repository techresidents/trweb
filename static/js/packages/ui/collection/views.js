define([
    'jquery',
    'underscore',
    'core'
], function(
    $,
    _,
    core) {

    var EVENTS = {
    };

    /**
     * Collection View.
     * @constructor
     * @param {Object} options
     *   collection: {Collection} collection (required)
     *   template: UI template
     *   context: UI context
     *   viewFactory: child view factory
     *   selector: UI selector
     *   sort: sort function
     */
    var CollectionView = core.view.View.extend({

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
            this.sort = options.sort;
            this.modelViewMap = {};
            this.viewModelMap = {};
            
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
            this.viewModelMap = {};


            this.collection.each(this.createChildView, this);
        },

        createChildView: function(model) {
            var view = this.viewFactory.create({
                model: model
            });
            if(view) {
                view.$el.addClass(this.childClasses().join(' '));
                if(this.sort) {
                    var sort = this.sort;
                    core.array.binaryInsert(this.childViews, view, function(a, b) {
                        return core.array.defaultCompare(sort(a), sort(b));
                    });
                } else {
                    this.childViews.push(view);
                }
                this.modelViewMap[model.cid] = view;
                this.viewModelMap[view.cid] = model;
            }
            return view;
        },

        appendChildView: function(view) {
            var model = this.viewModelMap[view.cid];
            if (model) {
                view.$el.data('id', model.id || model.cid);
            }
            this.append(view, this.selector);
        },

        removeChildView: function(view) {
            this.childViews = _.without(this.childViews, view);
            view.destroy();
        },

        sortChildViews: function() {
            if(this.sort) {
                this.childViews = _.sortBy(this.childViews, this.sort);
            }
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
            }, core.base.getValue(this, 'context', this));

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
            if(this.sort) {
                this.render();
            } else {
                this.appendChildView(view);
            }
        },

        onRemove: function(model) {
            var view = this.modelViewMap[model.cid];
            if(view) {
                this.removeChildView(view);
                delete this.modelViewMap[model.cid];
                delete this.viewModelMap[view.cid];
            }
        }

    });

    /**
     * Wrapper View.
     * @constructor
     */
    var WrapperView = core.view.View.extend({

        initialize: function(options) {
            this.childView = options.view;
        },

        childViews: function() {
            return [this.childView];
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
                options.viewFactory = new core.factory.FunctionFactory(function(options) {
                    var view = null;
                    var originalView = originalViewFactory.create(options);
                    if(originalView) {
                        view = new ListItemWrapperView({view: originalView});
                    }
                    return view;
                });

                if(options.sort) {
                    var sort = options.sort;
                    options.sort = function(view) {
                        return sort(view.childView);
                    };
                }
            }

            CollectionView.prototype.initialize.call(this, options);
        },

        classes: function() {
            return ['collection-list'];
        }
    });

    /**
     * Ordered List View.
     * @constructor
     * @param {Object} options
     *   collection: {Collection} collection (required)
     *   modelRankAttribute: {String} name of the model attribute to manipulate if the
     *      collection can be reordered by the user (optional)
     */
    var OrderedListView = ListView.extend({

        tagName: 'ol',

        events: {
            'click .up': 'onRankUp',
            'click .down': 'onRankDown',
            'click .remove': 'onRemoveListItem'
        },

        initialize: function(options) {
            this.rankAttribute = options.modelRankAttribute;
            ListView.prototype.initialize.call(this, options);
        },

        onRemoveListItem: function(e) {
            var that = this;
            var id = this.eventToId(e);
            var model = this.collection.get(id);
            if(model) {
                this.collection.remove(model);
                if (this.rankAttribute) {
                    // Update the rank of each item below the removed item
                    this.collection.each(function(m) {
                        if(m.get(that.rankAttribute) > model.get(that.rankAttribute)) {
                            m.set(that.rankAttribute, m.get(that.rankAttribute) - 1);
                        }
                    });
                }
                this.sortChildViews();
                this.render();
            }
        },

        onRankUp: function(e) {
            console.log('onRankUp');
            if (this.rankAttribute) {
                var that = this;
                var id = this.eventToId(e);
                var model = this.collection.get(id);
                var rank = model.get(this.rankAttribute);
                if(rank !== 0) {
                    // Find the list item above this one, and move it down
                    // one place (swap it)
                    this.collection.each(function(m) {
                        if(m.cid !== model.cid &&
                            m.get(that.rankAttribute) === rank - 1) {
                            m.set(that.rankAttribute, m.get(that.rankAttribute) + 1);
                        }
                    });
                    // Move this item up the list by one spot (top rank is 0)
                    model.set(this.rankAttribute, rank - 1);
                    this.sortChildViews();
                    this.render();
                }
            }
        },

        onRankDown: function(e) {
            console.log('onRankDown');
            if (this.rankAttribute) {
                var that = this;
                var id = this.eventToId(e);
                var model = this.collection.get(id);
                var rank = model.get(this.rankAttribute);
                if(rank < this.collection.length - 1) {
                    // Find the list item below this one, and move it up
                    // one place (swap it)
                    this.collection.each(function(m) {
                        if(m.cid !== model.cid &&
                            m.get(that.rankAttribute) === rank + 1) {
                            m.set(that.rankAttribute, m.get(that.rankAttribute) - 1);
                        }
                    });
                    // Move this item down the list by one spot
                    model.set(this.rankAttribute, rank + 1);
                    this.sortChildViews();
                    this.render();
                }
            }
        }
    });

    return {
        EVENTS: EVENTS,
        CollectionView: CollectionView,
        ListView: ListView,
        OrderedListView: OrderedListView
    };
});
