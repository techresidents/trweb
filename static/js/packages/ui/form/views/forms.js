define(/** @exports ui/form/views/forms */[
    'jquery',
    'underscore',
    'backbone',
    'core',
    '../models',
    '../validators',
    './actions',
    'text!../templates/form.html',
    'text!../templates/form_error.html'
], function(
    $,
    _,
    Backbone,
    core,
    models,
    validators,
    actions_views,
    form_template,
    form_error_template) {

    var FormErrorView = core.view.View.extend(
    /** @lends module:ui/form/views~FormErrorView.prototype */ {

        events: {
        },
        
        /**
         * FormErrorView constructor
         * @constructor
         * @augments module:core/view~View
         * @param {object} options Options object
         * @param {FormState} options.state Form state model
         */
        initialize: function(options) {
            options = _.extend({
                template: form_error_template
            }, options);

            this.template = _.template(options.template);
            this.state = options.state;

            //bind events
            this.listenTo(this.state, 'change:error', this.render);
        },

        classes: function() {
            return ['form-error'];
        },

        context: function() {
            return {
                state: this.state.toJSON()
            };
        },

        render: function() {
            var context = this.context();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        }
    });

    /**
     * {@link module:core/factory~Factory|Factory} class for convenience.
     */
    FormErrorView.Factory = core.factory.buildFactory(FormErrorView);

    
    var FormView = core.view.View.extend(
    /** @lends module:ui/form/views~FormView.prototype */ {

        events: {
            'form-change-event': 'onFormChange',
            'form-action-event': 'onFormAction'
        },
        
        /**
         * FormView constructor
         * @constructor
         * @augments module:core/view~View
         * @param {object} options Options object
         * @param {array} options.fields Array of Field objects
         * @param {array} options.actions Array of Action objects
         * @param {object} options.model Model to commit form
         *   values to.
         * @param {FormValidator|function} [options.validator] Form validator
         * @param {Factory} [options.actionsViewFactory] Actions view factory.
         * @param {Factory} [options.errorViewFactory] Error view factory.
         * @param {string} [options.template] Form template
         */
        initialize: function(options) {
            options = _.extend({
                template: form_template,
                fields: [],
                actions: [],
                validator: new validators.FormValidator()
            }, options);

            if(!options.actionsViewFactory) {
                options.actionsViewFactory =
                    new actions_views.FormActionsView.Factory();
            }

            if(!options.errorViewFactory) {
                options.errorViewFactory =
                    new FormErrorView.Factory();
            }

            this.template = _.template(options.template);
            this.model = options.model;
            this.legend = options.legend;
            this.validator = options.validator;
            this.actionsViewFactory = options.actionsViewFactory;
            this.errorViewFactory = options.errorViewFactory;
            this.state = new models.FormState({
                model: this.model
            });

            //add field models to state model.
            this.state.fields().reset(_.map(options.fields, function(field) {
                return {
                    field: field
                };
            }));

            //add action models to state model.
            this.state.actions().reset(_.map(options.actions, function(action) {
                return {
                    action: action
                };
            }));

            //event bindings
            this.listenTo(this.state.fields(), 'reset', this.onResetFields);
            this.listenTo(this.state.fields(), 'add', this.onAddField);
            this.listenTo(this.state.fields(), 'remove', this.onRemoveField);
            
            //maps
            this.fieldMap = {};
            this.fieldViewMap = {};

            //child views
            this.fieldViews = [];
            this.actionsView = null;
            this.errorView = null;
            this.initChildViews();
        },

        childViews: function() {
            return this.fieldViews.concat([this.controlsView]);
        },

        initChildViews: function() {
            //field views
            this.onResetFields();

            //actions view
            this.actionsView = this.actionsViewFactory.create({
                state: this.state
            });

            //actions view
            this.errorView = this.errorViewFactory.create({
                state: this.state
            });
        },

        addField: function(field) {
            this.state.fields().add({
                field: field
            });
        },

        removeField: function(field) {
            var model = _.first(this.state.fields().where({
                field: field
            }));

            if(model) {
                this.state.fields().remove(model);
            }
        },

        addAction: function(action) {
            this.state.actions().add({
                action: action
            });
        },

        removeAction: function(action) {
            var model = _.first(this.state.actions().where({
                action: action
            }));

            if(model) {
                this.state.actions().remove(model);
            }
        },

        getField: function(name) {
            return this.fieldMap[name];
        },

        getView: function(name) {
            return this.filedViewMap[name];
        },

        classes: function() {
            return ['form'];
        },

        context: function() {
            return {
                state: this.state.toJSON(),
                legend: this.legend
            };
        },

        render: function() {
            var context = this.context();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            
            //field views
            _.each(this.fieldViews, function(view) {
                this.append(view, 'fieldset');
            }, this);

            //actions view
            this.append(this.actionsView, 'fieldset');

            //error view
            this.append(this.errorView, '.form-error-container');


            return this;
        },

        validate: function(options) {
            var valid;

            options = _.extend({
                showError: true
            }, options);

            try {
                valid = this.validator.validate(this.state);
                if(valid) {
                    this.state.set({valid: true, error: null });
                } else {
                    this.state.set({valid: false, error: null });
                }
            } catch(e) {
                if(options.showError) {
                    this.state.set({ valid: false, error: e.message });
                } else {
                    this.state.set({ valid: false });
                }
            }

            return valid;
        },

        commit: function() {
            var result = true;
            this.state.fields().each(function(fieldModel) {
                var field = fieldModel.field();
                if(!field.commit()) {
                    result = false;
                }
            });
            return result;
        },

        onAddField: function(fieldModel) {
            this._addField(fieldModel.field());
        },

        onRemovefield: function(fieldModel) {
            this._removeField(fieldModel.field());
        },

        onResetFields: function() {
            _.each(this.fieldViews, function(view) {
                this.view.destroy();
            }, this);

            this.fieldsViews = [];
            this.state.fields().each(function(fieldModel) {
                this._addField(fieldModel.field());
            }, this);
        },

        onFormChange: function(e, eventBody) {
            this._updateDirtyFlag();
            this.validate();
        },

        onFormAction: function(e, eventBody) {
            var action = eventBody.action;
            if(action.primary) {
                if(this.validate() && this.commit()) {
                    action.handle(this.state);
                }
            } else {
                action.handle(this.state);
            }
        },

        _updateDirtyFlag: function() {
            var dirty = false;
            this.state.fields().each(function(fieldModel) {
                var field = fieldModel.field();
                if(field.state.dirty()) {
                    dirty = true;
                }
            }, this);
            this.state.set({dirty: dirty});
        },

        _addField: function(field) {
            var view = field.createView();
            this.fieldViews.push(view);
            this.fieldMap[field.name] = field;
            this.fieldViewMap[field.name] = view;
        },

        _removeField: function(field) {
            var view = this.getView(field.name);
            if(view) {
                view.destroy();
                delete this.fieldMap[field.name];
                delete this.fieldViewMap[field.name];
            }
            //this.stopListening(field.state);
        }
    });

    /**
     * {@link module:core/factory~Factory|Factory} class for convenience.
     */
    FormView.Factory = core.factory.buildFactory(FormView);

    return {
        FormView: FormView
    };

});
