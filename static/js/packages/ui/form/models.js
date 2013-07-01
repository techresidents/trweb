define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone) {
    
    /**
     * Action State Model
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var ActionState = Backbone.Model.extend({

        defaults: {
            label: null,
            primary: true,
            enabled: true,
            executing: false 
        },

        label: function() {
            return this.get('label');
        },

        setLabel: function(label) {
            this.set('label', label);
            return this;
        },

        primary: function() {
            return this.get('primary');
        },

        setPrimary: function(primary) {
            this.set('primary', primary);
            return this;
        },

        enabled: function() {
            return this.get('enabled');
        },

        setEnabled: function(enabled) {
            this.set('enabled', enabled);
            return this;
        },

        executing: function() {
            return this.get('executing');
        },

        setExecuting: function(executing) {
            this.set('executing', executing);
            return this;
        }
    });

    /**
     * Action Model
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var ActionModel = Backbone.Model.extend({

        defaults: {
            field: null
        },

        action: function() {
            return this.get('action');
        },

        setAction: function(action) {
            this.set('action', action);
            return this;
        }
    });

    /**
     * Field State Model
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var FieldState = Backbone.Model.extend({

        defaults: {
            label: null,
            rawValue: null,
            value: null,
            dirty: false,
            valid: false,
            error: null,
            showError: false,
            enabled: true,
            required: true
        },

        label: function() {
            return this.get('label');
        },

        setLabel: function(label) {
            this.set('label', label);
            return this;
        },

        rawValue: function() {
            return this.get('rawValue');
        },

        setRawValue: function(rawValue) {
            this.set('rawValue', rawValue);
            return this;
        },

        value: function() {
            return this.get('value');
        },

        setValue: function(value) {
            this.set('value', value);
            return this;
        },

        dirty: function() {
            return this.get('dirty');
        },

        setDirty: function(dirty) {
            this.set('dirty', dirty);
            return this;
        },

        valid: function() {
            return this.get('valid');
        },

        setValid: function(valid) {
            this.set('valid', valid);
            return this;
        },

        error: function() {
            return this.get('error');
        },

        setError: function(error) {
            this.set('error', error);
            return this;
        },

        showError: function() {
            return this.get('showError');
        },

        setShowError: function(showError) {
            this.set('showError', showError);
            return this;
        },

        enabled: function() {
            return this.get('enabled');
        },

        setEnabled: function(enabled) {
            this.set('enabled', enabled);
            return this;
        },

        required: function() {
            return this.get('required');
        },

        setRequired: function(required) {
            this.set('required', required);
            return this;
        }

    });

    /**
     * Field Model
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var FieldModel = Backbone.Model.extend({

        defaults: {
            field: null
        },

        field: function() {
            return this.get('field');
        },

        setField: function(field) {
            this.set('field', field);
            return this;
        }
    });

    /**
     * Field Collection
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var FieldCollection = Backbone.Collection.extend({
        model: FieldModel
    });


    /**
     * Action Collection
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var ActionCollection = Backbone.Collection.extend({
        model: ActionModel
    });

    /**
     * Form State Model
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var FormState = Backbone.Model.extend({

        defaults: function() {
            return {
                model: null,
                fields: new FieldCollection(),
                actions: new ActionCollection(),
                dirty: false,
                valid: false,
                error: null,
                executing: false
            };
        },

        fields: function() {
            return this.get('fields');
        },

        actions: function() {
            return this.get('actions');
        },

        model: function() {
            return this.get('model');
        },

        setModel: function(model) {
            this.set('model', model);
            return this;
        },

        dirty: function() {
            return this.get('dirty');
        },

        setDirty: function(dirty) {
            this.set('dirty', dirty);
            return this;
        },

        valid: function() {
            return this.get('valid');
        },

        setValid: function(valid) {
            this.set('valid', valid);
            return this;
        },

        error: function() {
            return this.get('error');
        },

        setError: function(error) {
            this.set('error', error);
            return this;
        },

        executing: function() {
            return this.get('executing');
        },

        setExecuting: function(executing) {
            this.set('executing', executing);
            return this;
        },

        toJSON: function() {
            var result = FormState.__super__.toJSON.call(this);
            result.fields = this.fields().map(function(fieldModel) {
                var field = fieldModel.field();
                return {
                    state: field.state.toJSON()
                };
            }, this);
            result.actions = this.actions().map(function(actionModel) {
                var action = actionModel.action();
                return {
                    state: action.state.toJSON()
                };
            }, this);
            return result;
        }
    });

    return {
        ActionState: ActionState,
        ActionModel: ActionModel,
        FieldState: FieldState,
        FieldModel: FieldModel,
        FieldCollection: FieldCollection,
        FormState: FormState
    };
});
