define(/** @exports ui/form/fields */[
    'jquery',
    'backbone',
    'underscore',
    'core',
    './comparators',
    './formatters',
    './models',
    './stores',
    './validators',
    './views'
], function(
    $,
    Backbone,
    _,
    core,
    comparators,
    formatters,
    models,
    stores,
    validators,
    views) {

    var Field = core.base.Base.extend(
    /** @lends module:ui/form/fields~Field.prototype */ {

        /**
         * Form Field constructor
         * @constructor
         * @augments module:core/base~Base
         * @param {object} options Options object
         * @param {string} options.name Field name which can be used
         *   as a model path (i.e. topic__tree__title)
         * @param {Factory} options.viewFactory Field view factory
         *   to use to create the field view.
         * @param {object} [options.viewOptions] Additional view options
         *   to pass to the viewFactory create function.
         * @param {Store} [options.store] Store object to facilitate
         *   read/write access to underlying model / collection
         *   values. If this is not provided, options.model must
         *   be provided and a default store will be created 
         *   with stores.factory using options.model and options.name
         *   as the path.
         * @param {object} [options.model] Model object which must
         *   be provided if options.store is omitted. If provided
         *   the store will be created with stores.factory using
         *   this model and options.name as the path.
         * @param {boolean} [options.enabled=true] Boolean indicating
         *   that the field is enabled
         * @param {boolean} [options.required=true] Boolean indicating
         *   that the field is required.
         * @param {Formatter|function} [options.formatter] Field formatter
         *   to use to format the field value for display. For example,
         *   for a number field this may convert '1000' to '1,000'.
         * @param {FieldValidator|function} [options.validator] Field validator
         *   to use to validate input values and convert them if neccessary.
         *   For example, for a number field this may require converting
         *   a string to a number.
         * @param {Comparator|function} options.comparator Field comparator
         *   to use to compare field values. Compare function should be of the
         *   form compare(a, b) and return 1 if a > b, -1 if a < b, 0 if a
         *   b are equal, and undefined if comparison is ambiguous.
         */
        initialize: function(options) {
            options = _.extend({
                enabled: true,
                required: true,
                viewOptions: {},
                storeOptions: {}
            }, options);

            if(!options.validator) {
                options.validator = new validators.FieldValidator({
                    required: options.required
                });
            }

            if(!options.formatter) {
                options.formatter = new formatters.Formatter();
            }

            if(!options.comparator) {
                options.comparator = new comparators.Comparator();
            }
            
            //for convenience create the store if model
            //is providing using the field name as the path
            if(!options.store && options.model) {
                options.store = stores.factory.create({
                    model: options.model,
                    path: options.name,
                    storeOptions: options.storeOptions
                });
            }

            this.name = options.name;
            this.store = options.store;
            this.formatter = options.formatter;
            this.validator = options.validator;
            this.comparator = options.comparator;
            this.viewFactory = options.viewFactory;
            this.viewOptions = options.viewOptions;

            this.state = new models.FieldState({
                label: options.label,
                enabled: options.enabled,
                required: options.required,
                value: this.read(),
                valid: true
            });

            this.formState = null;


            this.view = null;

            //bind events
            this.listenTo(this.store, 'change', this.onStoreChange);
        },

        setFormState: function(state) {
            this.formState = state;
            this.format();
            this.validate();
        },
        
        createView: function(options) {
            options = _.extend({
                field: this,
                state: this.state
            }, this.viewOptions, options);
            this.view = this.viewFactory.create(options);
            return this.view;
        },

        formatValue: function(value) {
            if(_.isFunction(this.formatter)) {
                value = this.formatter(value);
            } else if(_.isObject(this.formatter)) {
                value = this.formatter.format(value);
            }
            return value;
        },

        validateValue: function(value) {
            if(_.isFunction(this.validator)) {
                value = this.validator(value);
            } else if(_.isObject(this.validator)) {
                value = this.validator.validate(value);
            }
            return value;
        },

        format: function() {
            var valid = this.state.valid();
            if(valid) {
                var value = this.state.value();
                var rawValue = this.formatValue(value);
                this.state.setRawValue(rawValue);
            }
        },

        validate: function() {
            var value = this.state.rawValue();

            try {
                value = this.validateValue(value);
                var dirty = this.compare(this.read({clone: false}), value) !== 0;
                this.state.set({
                    value: value,
                    valid: true,
                    dirty: dirty,
                    error: null
                });
                result = true;
            } catch(e) {
                this.state.set({
                    value: null,
                    valid: false,
                    dirty: true,
                    error: e.message
                });
            }
            
            return this.state.valid();
        },

        compare: function(a, b) {
            var result;
            if(_.isFunction(this.comparator)) {
                result = this.comparator(a, b);
            } else if(_.isObject(this.comparator)) {
                result = this.comparator.compare(a, b);
            }
            return result;
        },

        commit: function() {
            var result = false;
            if(this.state.valid()) {
                this.write(this.state.value());
                result = true;
            }
            return result;
        },

        revert: function() {
            //In the case where the underlying store changes we null out
            //value and rawValue with the silent flag. This will not
            //immediately cause a change event to fire due to the silent
            //flag. But it will guarantee that we get a change event
            //the next time we set them. If we did not do this, change
            //events would not fire in the case where value and rawValue
            //are objects and the contents have changed.
            this.state.set(
                    { value: undefined, rawValue: undefined },
                    { silent: true});
            
            this.state.set({
                value: this.read(),
                valid: true
            });

            this.format();
            this.validate();

            return true;
        },

        read: function(options) {
            return this.store.read(options);
        },

        write: function(value, options) {
            this.store.write(value, options);
        },

        destroy: function() {
            this.stopListening();
        },

        onStoreChange: function() {
            this.revert();
        }
    });

    //add support for events to Field
    _.extend(Field.prototype, Backbone.Events);

    var InputField = Field.extend(
    /** @lends module:ui/form/fields~InputField.prototype */ {

        /**
         * Input Field constructor
         * @constructor
         * @augments module:ui/form/fields~Field
         * @param {object} options Options object
         * @param {string} options.name Field name which can be used
         *   as a model path (i.e. topic__tree__title)
         * @param {Factory} options.viewFactory Field view factory
         *   to use to create the field view.
         * @param {object} [options.viewOptions] Additional view options
         *   to pass to the viewFactory create function.
         * @param {boolean} [options.enabled=true] Boolean indicating
         *   that the field is enabled
         * @param {boolean} [options.required=true] Boolean indicating
         *   that the field is required.
         * @param {Formatter|function} [options.formatter] Field formatter
         *   to use to format the field value for display.
         * @param {FieldValidator|function} [options.validator] Field validator
         *   to use to validate input values and convert them if neccessary.
         * @param {number} [options.maxLength=100] Maximum length
         * @param {placeholder} [options.placeholder] Input placeholder text.
         */
        initialize: function(options) {
            options = _.extend({
                required: true,
                enabled: true,
                maxLength: 100,
                placeholder: null
            }, options);

            options.viewOptions = _.extend({
                maxLength: options.maxLength,
                placeholder: options.placeholder
            }, options.viewOptions);
            
            if(!options.viewFactory) {
                options.viewFactory = new views.InputFieldView.Factory();
            }

            if(!options.validator) {
                options.validator = new validators.StringValidator({
                    required: options.required
                });
            }

            InputField.__super__.initialize.call(this, options);
        }
    });

    var TextField = InputField.extend(
    /** @lends module:ui/form/fields~TextField.prototype */ {

        /**
         * Text Field constructor
         * @constructor
         * @augments module:ui/form/fields~InputField
         * @param {object} options Options object
         * @param {number} [options.rows=3] Number of rows
         * @param {string} options.name Field name which can be used
         *   as a model path (i.e. topic__tree__title)
         * @param {Factory} options.viewFactory Field view factory
         *   to use to create the field view.
         * @param {object} [options.viewOptions] Additional view options
         *   to pass to the viewFactory create function.
         * @param {boolean} [options.enabled=true] Boolean indicating
         *   that the field is enabled
         * @param {boolean} [options.required=true] Boolean indicating
         *   that the field is required.
         * @param {Formatter|function} [options.formatter] Field formatter
         *   to use to format the field value for display.
         * @param {FieldValidator|function} [options.validator] Field validator
         *   to use to validate input values and convert them if neccessary.
         * @param {number} [options.maxLength=100] Maximum length
         * @param {placeholder} [options.placeholder] Input placeholder text.
         */
        initialize: function(options) {
            options = _.extend({
                maxLength: 4096,
                rows: 3
            }, options);

            options.viewOptions = _.extend({
                rows: options.rows
            }, options.viewOptions);

            if(!options.viewFactory) {
                options.viewFactory = new views.TextFieldView.Factory();
            }

            TextField.__super__.initialize.call(this, options);
        }
    });

    var IntegerField = InputField.extend(
    /** @lends module:ui/form/fields~IntegerField.prototype */ {

        /**
         * Integer Field constructor
         * @constructor
         * @augments module:ui/form/fields~Field
         * @param {object} options Options object
         * @param {string} options.name Field name which can be used
         *   as a model path (i.e. topic__tree__title)
         * @param {Factory} options.viewFactory Field view factory
         *   to use to create the field view.
         * @param {object} [options.viewOptions] Additional view options
         *   to pass to the viewFactory create function.
         * @param {boolean} [options.enabled=true] Boolean indicating
         *   that the field is enabled
         * @param {boolean} [options.required=true] Boolean indicating
         *   that the field is required.
         * @param {Formatter|function} [options.formatter] Field formatter
         *   to use to format the field value for display.
         * @param {FieldValidator|function} [options.validator] Field validator
         *   to use to validate input values and convert them if neccessary.
         * @param {number} [options.maxLength=100] Maximum length
         * @param {number} [options.max] Maximum value
         * @param {number} [options.min] Minimum value
         */
        initialize: function(options) {
            options = _.extend({
                required: true,
                enabled: true
            }, options);

            if(!options.formatter) {
                options.formatter = new formatters.IntegerFormatter();
            }

            if(!options.validator) {
                options.validator = new validators.IntegerValidator({
                    required: options.required,
                    min: options.min,
                    max: options.max
                });
            }

            IntegerField.__super__.initialize.call(this, options);
        }
    });

    var FloatField = InputField.extend(
    /** @lends module:ui/form/fields~FloatField.prototype */ {

        /**
         * Float Field constructor
         * @constructor
         * @augments module:ui/form/fields~Field
         * @param {object} options Options object
         * @param {string} options.name Field name which can be used
         *   as a model path (i.e. topic__tree__title)
         * @param {Factory} options.viewFactory Field view factory
         *   to use to create the field view.
         * @param {object} [options.viewOptions] Additional view options
         *   to pass to the viewFactory create function.
         * @param {boolean} [options.enabled=true] Boolean indicating
         *   that the field is enabled
         * @param {boolean} [options.required=true] Boolean indicating
         *   that the field is required.
         * @param {Formatter|function} [options.formatter] Field formatter
         *   to use to format the field value for display.
         * @param {FieldValidator|function} [options.validator] Field validator
         *   to use to validate input values and convert them if neccessary.
         * @param {number} [options.maxLength=100] Maximum length
         * @param {number} [options.max] Maximum value
         * @param {number} [options.min] Minimum value
         */
        initialize: function(options) {
            options = _.extend({
                required: true,
                enabled: true
            }, options);

            if(!options.formatter) {
                options.formatter = new formatters.FloatFormatter();
            }

            if(!options.validator) {
                options.validator = new validators.FloatValidator({
                    required: options.required,
                    min: options.min,
                    max: options.max
                });
            }

            FloatField.__super__.initialize.call(this, options);
        }
    });

    var DateField = Field.extend(
    /** @lends module:ui/form/fields~DateField.prototype */ {

        /**
         * Date Field constructor
         * @constructor
         * @augments module:ui/form/fields~Field
         * @param {object} options Options object
         * @param {string} options.name Field name which can be used
         *   as a model path (i.e. topic__tree__title)
         * @param {Factory} options.viewFactory Field view factory
         *   to use to create the field view.
         * @param {object} [options.viewOptions] Additional view options
         *   to pass to the viewFactory create function.
         * @param {boolean} [options.enabled=true] Boolean indicating
         *   that the field is enabled
         * @param {boolean} [options.required=true] Boolean indicating
         *   that the field is required.
         * @param {array} [options.formats=['MM/dd/yyyy']] Array of date
         *   format strings.
         * @param {Formatter|function} [options.formatter] Field formatter
         *   to use to format the field value for display.
         * @param {FieldValidator|function} [options.validator] Field validator
         *   to use to validate input values and convert them if neccessary.
         */
        initialize: function(options) {
            options = _.extend({
                formats: ['MM/dd/YYYY']
            }, options);

            options.viewOptions = _.extend({
                formats: options.format,
                maxLength: options.maxLength,
                placeholder: options.placeholder
            }, options.viewOptions);

            if(!options.validator) {
                options.validator = new validators.DateValidator();
            }
            
            if(!options.viewFactory) {
                options.viewFactory = new views.DateFieldView.Factory({
                });
            }
            
            this.formats = options.formats;

            DateField.__super__.initialize.call(this, options);
        }
    });

    var CheckboxField = Field.extend(
    /** @lends module:ui/form/fields~CheckboxField.prototype */ {

        /**
         * Checkbox Field constructor
         * @constructor
         * @augments module:ui/form/fields~Field
         * @param {object} options Options object
         * @param {string} options.name Field name which can be used
         *   as a model path (i.e. topic__tree__title)
         * @param {Factory} options.viewFactory Field view factory
         *   to use to create the field view.
         * @param {object} [options.viewOptions] Additional view options
         *   to pass to the viewFactory create function.
         * @param {boolean} [options.enabled=true] Boolean indicating
         *   that the field is enabled
         * @param {boolean} [options.required=true] Boolean indicating
         *   that the field is required.
         * @param {FieldValidator|function} [options.validator] Field validator
         *   to use to validate input values and convert them if neccessary.
         */
        initialize: function(options) {
            if(!options.viewFactory) {
                options.viewFactory = new views.CheckboxFieldView.Factory();
            }

            CheckboxField.__super__.initialize.call(this, options);
        },

        read: function() {
            var result = this.store.read();

            //convert null and undefined to false
            if(result === null || result === undefined) {
                result = false;
            }
            return result;
        }
    });

    var DropdownField = Field.extend(
    /** @lends module:ui/form/fields~DropdownField.prototype */ {

        /**
         * Dropdown Field constructor
         * @constructor
         * @augments module:ui/form/fields~Field
         * @param {object} options Options object
         * @param {string} options.name Field name which can be used
         *   as a model path (i.e. topic__tree__title)
         * @param {Factory} options.viewFactory Field view factory
         *   to use to create the field view.
         * @param {object} [options.viewOptions] Additional view options
         *   to pass to the viewFactory create function.
         * @param {boolean} [options.enabled=true] Boolean indicating
         *   that the field is enabled
         * @param {boolean} [options.required=true] Boolean indicating
         *   that the field is required.
         * @param {FieldValidator|function} [options.validator] Field validator
         *   to use to validate input values and convert them if neccessary.
         */
        initialize: function(options) {

            options.viewOptions = _.extend({
                choices: options.choices
            }, options.viewOptions);

            if(!options.viewFactory) {
                options.viewFactory = new views.DropdownFieldView.Factory();
            }

            this.choices = options.choices;

            DropdownField.__super__.initialize.call(this, options);
        },

        read: function(options) {
            var value = this.store.read(options);

            var selectedChoice = _.find(this.choices, function(choice) {
                return this.compare(choice.value, value) === 0;
            }, this);

            if(!selectedChoice) {
                selectedChoice = _.first(this.choices);
            }

            return selectedChoice.value;
        }
    });

    var AutoCompleteField = Field.extend(
    /** @lends module:ui/form/fields~AutoCompleteField.prototype */ {

        /**
         * AutoComplete Field constructor
         * @constructor
         * @augments module:ui/form/fields~Field
         * @param {object} options Options object
         * @param {string} options.name Field name which can be used
         *   as a model path (i.e. topic__tree__title)
         * @param {Factory} options.viewFactory Field view factory
         *   to use to create the field view.
         * @param {Matcher} options.matcher Autocomplete matcher object
         * @param {number} options.maxResults Max autocomplete results
         *   to display
         * @param {object} [options.viewOptions] Additional view options
         *   to pass to the viewFactory create function.
         * @param {boolean} [options.enabled=true] Boolean indicating
         *   that the field is enabled
         * @param {boolean} [options.required=true] Boolean indicating
         *   that the field is required.
         * @param {Formatter|function} [options.formatter] Field formatter
         *   to use to format the field value for display.
         * @param {FieldValidator|function} [options.validator] Field validator
         *   to use to validate input values and convert them if neccessary.
         * @param {number} [options.maxLength=100] Maximum length
         * @param {placeholder} [options.placeholder] Input placeholder text.
         */
        initialize: function(options) {
            options = _.extend({
                maxResults: 8
            }, options);

            options.viewOptions = _.extend({
                maxLength: options.maxLength,
                placeholder: options.placeholder,
                maxResults: options.maxResults,
                matcher: options.matcher
            }, options.viewOptions);
            
            if(!options.viewFactory) {
                options.viewFactory = new views.AutoCompleteFieldView.Factory();
            }

            AutoCompleteField.__super__.initialize.call(this, options);
        }
    });

    var MultiAutoCompleteField = Field.extend(
    /** @lends module:ui/form/fields~MultiAutoCompleteField.prototype */ {

        /**
         * MultiAutoComplete Field constructor
         * @constructor
         * @augments module:ui/form/fields~Field
         * @param {object} options Options object
         * @param {string} options.name Field name which can be used
         *   as a model path (i.e. topic__tree__title)
         * @param {Factory} options.viewFactory Field view factory
         *   to use to create the field view.
         * @param {Matcher} options.matcher Autocomplete matcher object
         * @param {number} options.maxResults Max autocomplete results
         *   to display
         * @param {object} [options.viewOptions] Additional view options
         *   to pass to the viewFactory create function.
         * @param {boolean} [options.enabled=true] Boolean indicating
         *   that the field is enabled
         * @param {boolean} [options.required=true] Boolean indicating
         *   that the field is required.
         * @param {Formatter|function} [options.formatter] Field formatter
         *   to use to format the field value for display.
         * @param {FieldValidator|function} [options.validator] Field validator
         *   to use to validate input values and convert them if neccessary.
         * @param {placeholder} [options.placeholder] Input placeholder text.
         */
        initialize: function(options) {
            options = _.extend({
                maxResults: 8
            }, options);

            options.viewOptions = _.extend({
                placeholder: options.placeholder,
                maxResults: options.maxResults,
                matcher: options.matcher
            }, options.viewOptions);
            
            if(!options.viewFactory) {
                options.viewFactory = new views.MultiAutoCompleteFieldView.Factory();
            }

            MultiAutoCompleteField.__super__.initialize.call(this, options);
        }
    });

    return {
        Field: Field,
        InputField: InputField,
        TextField: TextField,
        IntegerField: IntegerField,
        FloatField: FloatField,
        DateField: DateField,
        CheckboxField: CheckboxField,
        DropdownField: DropdownField,
        AutoCompleteField: AutoCompleteField,
        MultiAutoCompleteField: MultiAutoCompleteField
    };

});
