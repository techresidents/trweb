define([
    'jquery',
    'underscore',
    'core/view',
    'events/type',
    'select/models',
    'template/views',
    'text!select/templates/select.html',
    'text!select/templates/multi_select.html',
    'text!select/templates/auto_multi_select.html',
    'text!select/templates/auto_multi_select_list.html'
], function(
    $,
    _,
    view,
    events_type,
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
    var BaseSelectView = view.View.extend({

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
            this.highlightedModel = null;

            //bind events
            this.listenTo(this.collection, 'reset add remove', this.render);
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
            this.highlightedModel = null;
            var context = this.context();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        },

        modelSelector: function(model) {
            return '.selection[data-id=' + model.cid + ']'; 
        },

        getSelected: function() {
            return this.collection.where({selected: true});
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
                this.triggerEvent(events_type.EventType.SELECT, {
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
                this.triggerEvent(events_type.EventType.UNSELECT, {
                    model: model
                });
            }
        },

        getHighlighted: function() {
            return this.highlightedModel;
        },

        highlight: function(model, triggerEvent) {
            if(!model) {
                return;
            }

            this.unhighlight(triggerEvent);

            this.$(this.modelSelector(model)).addClass(this.highlightedClass);
            this.highlightedModel = model;

            if(triggerEvent) {
                this.triggerEvent(events_type.EventType.HIGHLIGHT, {
                    model: model
                });
            }
        },

        unhighlight: function(triggerEvent) {
            var model = this.getHighlighted();
            if(!model) {
                return;
            }

            this.$(this.modelSelector(model)).removeClass(this.highlightedClass);

            this.highlightedModel = null;

            if(triggerEvent) {
                this.triggerEvent(events_type.EventType.UNHIGHLIGHT, {
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
    var AutoMultiSelectView = view.View.extend({

        defaultTemplate: auto_multi_select_template,

        events: {
            'change .selection': 'onChange',
            'keyup .search': 'onKeyUp'
        },

        
        initialize: function(options) {
            options = _.extend({
                template: this.defaultTemplate,
                inputPlaceholder: 'search'
            }, options);

            this.template = _.template(options.template);
            this.collection = options.collection;
            this.autoCollection = new this.collection.constructor();
            this.auto = options.auto;
            this.inputPlaceholder = options.inputPlaceholder;

            //bind events
            this.listenTo(this.autoCollection, 'reset', this.onAutoCollectionReset);

            //child views
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

            this.listView = new template_views.TemplateView({
                collection: this.collection,
                template: auto_multi_select_list_template,
                context: context
            });
        },

        childViews: function() {
            return [this.listView];
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
            this.append(this.listView);
            return this;
        },

        refresh: function() {
            var value = this.input().val();
            this.auto(value, this.autoCollection);
        },

        input: function() {
            return this.$('.search');
        },

        updateCollection: function() {
            var models = this.collection.where({selected: true});
            var workingCollection = new this.collection.constructor(models);

            this.autoCollection.each(function(model) {
                if(!workingCollection.where({value: model.value()}).length) {
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
                this.triggerEvent(events_type.EventType.SELECT, {
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
                this.triggerEvent(events_type.EventType.UNSELECT, {
                    model: model
                });
            }
        },

        onAutoCollectionReset: function() {
            this.updateCollection();
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

        onKeyUp: function(e) {
            this.refresh();
        }


    });

    return {
        EVENTS: EVENTS,
        SelectView: SelectView,
        MultiSelectView: MultiSelectView,
        AutoMultiSelectView: AutoMultiSelectView
    };

});
