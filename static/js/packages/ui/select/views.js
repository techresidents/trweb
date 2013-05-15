define([
    'jquery',
    'underscore',
    'core',
    '../events/type',
    '../input/views',
    '../select/models',
    '../template/views',
    'text!./templates/select.html',
    'text!./templates/multi_select.html',
    'text!./templates/auto_multi_select.html',
    'text!./templates/auto_multi_select_list.html'
], function(
    $,
    _,
    core,
    events,
    input_views,
    select_models,
    template_views,
    select_template,
    multi_select_template,
    auto_multi_select_template,
    auto_multi_select_list_template) {

    var EVENTS = {
    };

    /**
     * Base Select View.
     * @constructor
     * @param {Object} options
     *   collection: {Collection} containing models implememting {Selection} 
     *   model interface ('value', and 'selected' attributes).
     */
    var BaseSelectView = core.view.View.extend({

        initialize: function(options) {
            options = _.extend({
                multiSelect: false,
                selectedClass: 'selected',
                highlightedClass: 'highlighted'
            }, options);

            this.template = _.template(options.template);
            this.multiSelect = options.multiSelect;
            this.selectedClass = options.selectedClass;
            this.highlightedClass = options.highlightedClass;
            this.collection = options.collection;

            this.setCollection(this.collection);
        },

        context: function() {
            var collection = this.collection.map(function(model) {
                var json = model.toJSON();
                json.id = model.cid;
                return json;
            }, this);

            return {
                collection: collection
            };
        },

        classes: function() {
            return ['select'];
        },

        render: function() {
            var context = this.context();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        },

        modelSelector: function(model) {
            return '.selection[data-id=' + model.cid + ']'; 
        },

        getCollection: function() {
            return this.collection();
        },

        setCollection: function(collection) {
            if(this.collection) {
                this.stopListening(this.collection);
            }

            if(collection) {
                this.collection = collection;
                this.listenTo(this.collection, 'reset add remove', this.render);
            }
        },

        getSelected: function() {
            var selected = this.collection.where({selected: true});
            var result = selected.length ? selected[0] : null;
            return result;
        },

        select: function(model, triggerEvent) {
            if(!model) {
                return;
            }

            if(!this.multiSelect) {
                _.each(this.getSelected(), function(selectedModel) {
                    if(model.cid !== selectedModel.cid) {
                        this.unselect(selectedModel, dispatchEvent);
                    }
                }, this);
            }

            model.set({
                selected: true
            });

            this.$(this.modelSelector(model)).addClass(this.selectedClass);
            
            if(triggerEvent) {
                this.triggerEvent(events.SELECT, {
                    model: model
                });
            }
        },

        unselect: function(model, triggerEvent) {
            if(!model) {
                return;
            }

            model.set({
                selected: false
            });

            this.$(this.modelSelector(model)).removeClass(this.selectedClass);

            if(triggerEvent) {
                this.triggerEvent(events.UNSELECT, {
                    model: model
                });
            }
        },

        getHighlighted: function() {
            var highlighted = this.collection.where({highlighted: true});
            var result = highlighted.length ? highlighted[0] : null;
            return result;
        },

        highlight: function(model, triggerEvent) {
            if(!model) {
                return;
            }

            this.unhighlight(triggerEvent);

            model.set({
                highlighted: true
            });

            this.$(this.modelSelector(model)).addClass(this.highlightedClass);

            if(triggerEvent) {
                this.triggerEvent(events.HIGHLIGHT, {
                    model: model
                });
            }
        },

        unhighlight: function(triggerEvent) {
            var model = this.getHighlighted();
            if(!model) {
                return;
            }

            model.set({
                highlighted: false
            });

            this.$(this.modelSelector(model)).removeClass(this.highlightedClass);

            if(triggerEvent) {
                this.triggerEvent(events.UNHIGHLIGHT, {
                    model: model
                });
            }
        }
    });

    /**
     * Select View.
     * @constructor
     * @param {Object} options
     *   collection: {Collection} containing models implememting {Selection} 
     *   model interface ('value', and 'selected' attributes).
     */
    var SelectView = BaseSelectView.extend({

        defaultTemplate: select_template,

        events: {
            'click .selection': 'onClick',
            'mouseenter .selection': 'onEnter',
            'mouseleave .selection': 'onLeave'
        },
        
        initialize: function(options) {
            options = _.extend({
                template: this.defaultTemplate,
                multiSelect: false
            }, options);

            BaseSelectView.prototype.initialize.call(this, options);
        },

        onClick: function(e) {
            var id = $(e.currentTarget).data('id');
            var model = this.collection.get(id);

            this.select(model, true);
        },

        onEnter: function(e) {
            var id = $(e.currentTarget).data('id');
            var model = this.collection.get(id);
            this.highlight(model);
        },

        onLeave: function(e) {
            var id = $(e.currentTarget).data('id');
            var model = this.collection.get(id);
            this.unhighlight(model);
        }
    });

    /**
     * Multi Select View.
     * @constructor
     * @param {Object} options
     *   collection: {Collection} containing models implememting {Selection} 
     *   model interface ('value', and 'selected' attributes).
     */
    var MultiSelectView = BaseSelectView.extend({

        defaultTemplate: multi_select_template,

        events: {
            'change .selection': 'onChange',
            'mouseenter .selection': 'onEnter',
            'mouseleave .selection': 'onLeave'
        },
        
        initialize: function(options) {
            options = _.extend({
                template: this.defaultTemplate,
                multiSelect: true
            }, options);

            BaseSelectView.prototype.initialize.call(this, options);
        },

        classes: function() {
            return ['multi-select'];
        },

        onChange: function(e) {
            var checked = e.target.checked;
            var id = $(e.currentTarget).data('id');
            var model = this.collection.get(id);

            if(checked) {
                this.select(model, true);
            } else {
                this.unselect(model, true);
            }
        },

        onEnter: function(e) {
            var id = $(e.currentTarget).data('id');
            var model = this.collection.get(id);
            this.highlight(model);
        },

        onLeave: function(e) {
            var id = $(e.currentTarget).data('id');
            var model = this.collection.get(id);
            this.unhighlight(model);
        }
    });

    /**
     * Auto Multi Select View.
     * @constructor
     * @param {Object} options
     *   collection: {Collection} collection (required)
     */
    var AutoMultiSelectView = core.view.View.extend({

        defaultTemplate: auto_multi_select_template,

        events: {
            'change .selection': 'onSelectionChange',
            'change .input-handler': 'onInputChange' 
        },

        
        initialize: function(options) {
            options = _.extend({
                template: this.defaultTemplate,
                maxResults: 8,
                inputPlaceholder: 'search',
                throttle: 250,
                updateDuringTyping: false
            }, options);

            this.template = _.template(options.template);
            this.collection = options.collection;
            this.matcher = options.matcher;
            this.maxResults = options.maxResults;
            this.inputPlaceholder = options.inputPlaceholder;
            this.throttle = options.throttle;
            this.updateDuringTyping = options.updateDuringTyping;
            this.matchCollection = new this.collection.constructor();

            //child views
            this.inputHandlerView = null;
            this.listView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            var context = function(view) {
                var collection = view.collection.map(function(model) {
                    var json = model.toJSON();
                    json.id = model.cid;
                    return json;
                }, this);

                return {
                    collection: collection
                };
            };

            this.inputHandlerView = new input_views.InputHandlerView({
                inputView: this,
                inputSelector: '.search',
                throttle: this.throttle,
                updateDuringTyping: this.updateDuringTyping
            });

            this.listView = new template_views.TemplateView({
                collection: this.collection,
                template: auto_multi_select_list_template,
                context: context
            });
        },

        childViews: function() {
            return [this.inputHandlerView, this.listView];
        },

        classes: function() {
            return ['auto-multi-select'];
        },

        render: function() {
            var context = {
                inputPlaceholder: this.inputPlaceholder
            };
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.inputHandlerView);
            this.append(this.listView);
            return this;
        },

        refresh: function() {
            var that = this;
            var value = this.input().val();
            this.matcher.match(value, this.maxResults, function(search, results) {
                that.matchCollection.reset(results);
                that.updateCollection();
            });
        },

        input: function() {
            return this.$('.search');
        },

        updateCollection: function() {
            var models = this.collection.where({selected: true});
            var workingCollection = new this.collection.constructor(models);

            this.matchCollection.each(function(model) {
                if(!workingCollection.where({value: model.get('value')}).length) {
                    models.push(model);
                }
            }, this);
            
            this.collection.reset(models);
        },

        select: function(model, triggerEvent) {
            if(!model) {
                return;
            }

            model.set({
                selected: true
            });

            if(triggerEvent) {
                this.triggerEvent(events.SELECT, {
                    model: model
                });
            }
        },

        unselect: function(model, triggerEvent) {
            if(!model) {
                return;
            }

            model.set({
                selected: false
            });

            if(triggerEvent) {
                this.triggerEvent(events.UNSELECT, {
                    model: model
                });
            }
        },

        onInputChange: function(e) {
            this.refresh();
        },

        onSelectionChange: function(e) {
            var checked = e.target.checked;
            var id = $(e.currentTarget).data('id');
            var model = this.collection.get(id);

            if(checked) {
                this.select(model, true);
            } else {
                this.unselect(model, true);
            }
        }
    });

    return {
        EVENTS: EVENTS,
        SelectView: SelectView,
        MultiSelectView: MultiSelectView,
        AutoMultiSelectView: AutoMultiSelectView
    };

});
