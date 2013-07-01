define(/** @exports ui/form/views/fields */[
    'jquery',
    'underscore',
    'backbone',
    'core',
    '../../ac/views',
    '../../date/views',
    '../../input/views',
    '../events',
    '../models',
    'text!../templates/autocomplete_field.html',
    'text!../templates/checkbox_field.html',
    'text!../templates/date_field.html',
    'text!../templates/dropdown_field.html',
    'text!../templates/input_field.html',
    'text!../templates/multi_autocomplete_field.html'
], function(
    $,
    _,
    Backbone,
    core,
    ac_views,
    date_views,
    input_views,
    form_events,
    models,
    autocomplete_field_template,
    checkbox_field_template,
    date_field_template,
    dropdown_field_template,
    input_field_template,
    multi_autocomplete_field_template) {


    var FieldView = core.view.View.extend(
    /** @lends module:ui/form/views~FieldView.prototype */ {

        events: {
        },
        
        /**
         * FieldView constructor
         * @constructor
         * @augments module:core/view~View
         * @param {object} options Options object
         * @param {Field} options.field Field object
         * @param {FieldState} options.state Field state model
         * @param {string} [options.template] View template
         */
        initialize: function(options) {
            this.template = _.template(options.template);
            this.field = options.field;
            this.state = options.state;
        },

        classes: function() {
            var nameClass = 'form-field-' + this.field.name.replace('__', '-');
            return ['form-field', nameClass];
        },

        context: function() {
            return {
                state: this.state.toJSON()
            };
        },

        render: function() {
            return this;
        },

        focus: function() {
        },

        format: function() {
            this.field.format();
        },

        validate: function() {
            this.field.validate();
            this.state.setShowError(true);
            this.triggerEvent(form_events.FORM_CHANGE);
        }
    });

    /**
     * {@link module:core/factory~Factory|Factory} class for convenience.
     */
    FieldView.Factory = core.factory.buildFactory(FieldView);

    
    var InputFieldView = FieldView.extend(
    /** @lends module:ui/form/views~InputFieldView.prototype */ {
        
        events: _.extend({
            'blur input': 'onBlur'
        }, FieldView.prototype.events),
        
        /**
         * InputFieldView constructor
         * @constructor
         * @augments module:ui/form/views~FieldView
         * @param {object} options Options object
         * @param {Field} options.field Field object
         * @param {FieldState} options.state Field state model
         * @param {string} [options.placeholder] Placeholder text
         * @param {number} [options.maxLength=100] Maximum length
         * @param {boolean} [options.trim=true] Boolean indicating that
         *   whitespace should be trimmed from the input.
         * @param {number} [options.throttle=250] Number of milliseconds
         *   following an input change to wait before updating state
         *   model values.
         * @param {boolean} [options.updateDuringType=true] Boolean
         *   indicating that the throttle timer will be started as soon
         *   as the user starts typing (leading edge). If false
         *   the throttle timer will not be started until the user
         *   stops typing.
         * @param {boolean} [options.formatDuringTyping=false] Boolean
         *   indicating that the input should be formatted while
         *   the user is still typing. If false, the field will not
         *   be formatted until the input loses focus.
         * @param {boolean} [options.validateDuringTyping=true] Boolean
         *   indicating that the input should be validated while
         *   the user is still typing. If false, the field will not
         *   be validated until the input loses focus.
         * @param {boolean} [options.preventDefaultOnEnter=true] Boolean 
         *   indicating that default behavior should be prevented
         *   when the enter key is pressed.
         * @param {boolean} [options.blurOnEnter=true] Boolean 
         *   indicating that the input should give up focus
         *   when the enter key is pressed. Note that preventDefaultOnEnter
         *   must also be true.
         * @param {string} [options.classes] additional classes to apply
         *   to the <input> element.
         * @param {string} [options.template] View template
         */
        initialize: function(options) {
            options = _.extend({
                template: input_field_template,
                placeholder: null,
                maxLength: 100,
                throttle: 250,
                trim: true,
                updateDuringTyping: false,
                formatDuringTyping: false,
                validateDuringTyping: true,
                preventDefaultOnEnter: true,
                blurOnEnter: true,
                classes: null
            }, options);

            InputFieldView.__super__.initialize.call(this, options);
            
            this.placeholder = options.placeholder;
            this.maxLength = options.maxLength;
            this.throttle = options.throttle;
            this.trim = options.trim;
            this.updateDuringTyping = options.updateDuringTyping;
            this.validateDuringTyping = options.validateDuringTyping;
            this.formatDuringTyping = options.formatDuringTyping;
            this.preventDefaultOnEnter = options.preventDefaultOnEnter;
            this.blurOnEnter = options.blurOnEnter;
            this.inputClasses = options.classes;

            //bind events
            this.listenTo(this.state, 'change:value', this.onValueChange);
            this.listenTo(this.state, 'change:rawValue', this.onRawValueChange);
            this.listenTo(this.state, 'change:error', this.render);
            this.listenTo(this.state, 'change:showError', this.render);

            //child views
            this.inputHandlerView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [this.inputHandlerView];
        },

        initChildViews: function() {
            this.inputHandlerView = new input_views.InputHandlerView({
                model: this.state,
                modelAttribute: 'rawValue',
                inputView: this,
                inputSelector: 'input',
                throttle: this.throttle,
                trim: this.trim,
                updateDuringTyping: this.updateDuringType,
                preventDefaultOnEnter: this.preventDefaultOnEnter,
                blurOnEnter: this.blurOnEnter
            });
        },

        classes: function() {
            var result = InputFieldView.__super__.classes.call(this);
            result.push('input-form-field');
            return result;
        },

        context: function() {
            var result = InputFieldView.__super__.context.call(this);
            result.placeholder = this.placeholder;
            result.maxLength = this.maxLength;
            result.inputClasses = this.inputClasses;
            return result;
        },

        render: function() {
            var context = this.context();
            var hasFocus = this.inputHandlerView.hasFocus();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.inputHandlerView);

            if(hasFocus) {
                this.inputHandlerView.focus();
                this.inputHandlerView.setCursorEnd();
            }
            return this;
        },

        focus: function() {
            this.inputHandlerView.focus();
        },

        commit: function(options) {
            var result = false;
            if(this.validate()) {
                this.field.commit();
                result = true;
            }
            return result;
        },

        onBlur: function(e) {
            if(!this.validateDuringType) {
                this.validate();
            }
            if(!this.formatDuringTyping) {
                this.format();
            }
        },

        onValueChange: function() {
            var hasFocus = this.inputHandlerView.hasFocus();
            if(!hasFocus || this.formatDuringTyping) {
                this.format();
            }
        },

        onRawValueChange: function() {
            var hasFocus = this.inputHandlerView.hasFocus();
            if(!hasFocus || this.validateDuringTyping) {
                this.validate();
            }
            if(!hasFocus || this.formatDuringTyping) {
                this.format();
            }
        }
    });

    /**
     * {@link module:core/factory~Factory|Factory} class for convenience.
     */
    InputFieldView.Factory = core.factory.buildFactory(InputFieldView);

    
    var DateFieldView = FieldView.extend(
    /** @lends module:ui/form/views~DateFieldView.prototype */ {
        
        events: _.extend({
            'close': 'onClose'
        }, FieldView.prototype.events),
        
        /**
         * DateFieldView constructor
         * @constructor
         * @augments module:ui/form/views~FieldView
         * @param {object} options Options object
         * @param {Field} options.field Field object
         * @param {FieldState} options.state Field state model
         * @param {object} options.model Model to commit value to
         * @param {string} options.modelAttribute Model attribute to
         *   commit value to.
         * @param {string} [options.placeholder] Placeholder text
         * @param {number} [options.maxLength=20] Maximum length
         * @param {string} [options.classes] additional classes to apply
         *   to the <input> element.
         * @param {string} [options.template] View template
         */
        initialize: function(options) {
            options = _.extend({
                template: input_field_template,
                placeholder: null,
                maxLength: 20,
                classes: null
            }, options);

            DateFieldView.__super__.initialize.call(this, options);
            
            this.model = options.model;
            this.modelAttribute = options.modelAttribute;
            this.placeholder = options.placeholder;
            this.maxLength = options.maxLength;
            this.inputClasses = options.classes;

            //bind events
            this.listenTo(this.state, 'change:error', this.render);
            this.listenTo(this.state, 'change:showError', this.render);

            //child views
            this.dateView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [this.dateView];
        },

        initChildViews: function() {
            this.dateView = new date_views.DatePickerDropView({
                model: this.state,
                attribute: 'rawValue',
                inputView: this,
                inputSelector: 'input'
            });
        },

        classes: function() {
            var result = DateFieldView.__super__.classes.call(this);
            result.push('date-form-field');
            return result;
        },

        context: function() {
            var result = DateFieldView.__super__.context.call(this);
            result.placeholder = this.placeholder;
            result.maxLength = this.maxLength;
            result.inputClasses = this.inputClasses;
            return result;
        },

        render: function() {
            var context = this.context();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.dateView);
            return this;
        },

        focus: function() {
            this.$('input').focus();
        },

        onClose: function(e) {
            this.validate();
        }
    });

    /**
     * {@link module:core/factory~Factory|Factory} class for convenience.
     */
    DateFieldView.Factory = core.factory.buildFactory(DateFieldView);

    
    var CheckboxFieldView = FieldView.extend(
    /** @lends module:ui/form/views~CheckboxFieldView.prototype */ {
        
        events: _.extend({
            'click input': 'onClick'
        }, FieldView.prototype.events),
        
        /**
         * CheckboxFieldView constructor
         * @constructor
         * @augments module:ui/form/views~FieldView
         * @param {object} options Options object
         * @param {Field} options.field Field object
         * @param {FieldState} options.state Field state model
         * @param {object} options.model Model to commit value to
         * @param {string} options.modelAttribute Model attribute to
         *   commit value to.
         * @param {string} [options.template] View template
         */
        initialize: function(options) {
            options = _.extend({
                template: checkbox_field_template
            }, options);

            CheckboxFieldView.__super__.initialize.call(this, options);
            
            //bind events
            this.listenTo(this.state, 'change:error', this.render);
            this.listenTo(this.state, 'change:showError', this.render);
        },

        classes: function() {
            var result = CheckboxFieldView.__super__.classes.call(this);
            result.push('checkbox-form-field');
            return result;
        },

        render: function() {
            var context = this.context();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        },

        focus: function() {
            this.$('input').focus();
        },

        onClick: function(e) {
            var checked = this.$('input').is(':checked');
            this.state.setRawValue(checked);
            this.validate();
        }
    });

    /**
     * {@link module:core/factory~Factory|Factory} class for convenience.
     */
    CheckboxFieldView.Factory = core.factory.buildFactory(CheckboxFieldView);

    
    var DropdownFieldView = FieldView.extend(
    /** @lends module:ui/form/views~DropdownFieldView.prototype */ {
        
        events: _.extend({
            'change': 'onSelectChange'
        }, FieldView.prototype.events),
        
        /**
         * DropdownFieldView constructor
         * @constructor
         * @augments module:ui/form/views~FieldView
         * @param {object} options Options object
         * @param {Field} options.field Field object
         * @param {FieldState} options.state Field state model
         * @param {object} options.model Model to commit value to
         * @param {string} options.modelAttribute Model attribute to
         *   commit value to.
         * @param {string} [options.classes] additional classes to apply
         *   to the <input> element.
         * @param {string} [options.template] View template
         */
        initialize: function(options) {
            options = _.extend({
                template: dropdown_field_template
            }, options);

            DropdownFieldView.__super__.initialize.call(this, options);

            this.choices = options.choices;

            //add indices to choices
            _.each(this.choices, function(choice, index) {
                choice.index = index;
            }, this);
            
            this.selectedIndex = this._selectedIndex(this.state.rawValue());

            //bind events
            this.listenTo(this.state, 'change:rawValue', this.onRawValueChange);
            this.listenTo(this.state, 'change:error', this.render);
            this.listenTo(this.state, 'change:showError', this.render);

        },

        classes: function() {
            var result = DropdownFieldView.__super__.classes.call(this);
            result.push('dropdown-form-field');
            return result;
        },

        context: function() {
            var result = DateFieldView.__super__.context.call(this);
            result.choices = this.choices;
            result.selectedIndex = this.selectedIndex;
            return result;
        },

        render: function() {
            var context = this.context();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        },

        focus: function() {
            this.$('select').focus();
        },

        commit: function(options) {
            var result = false;
            if(this.validate()) {
                this.model.set(this.modelAttribute, this.state.value());
                result = true;
            }
            return result;
        },

        onSelectChange: function(e) {
            var index = this.$('select').val();
            index = parseInt(index, 10);
            var choice = this.choices[index];
            this.selectedIndex = index;
            this.state.setRawValue(choice.value);
        },
        
        onRawValueChange: function() {
            this.validate();

            var value = this.state.rawValue();
            var index = this._selectedIndex(value);
            if(index !== this.selectedIndex) {
                this.selectedIndex = index;
                this.render();
            }
        },

        _selectedIndex: function(value) {
            var choice = _.find(this.choices, function(choice) {
                return this.field.compare(choice.value, value) === 0;
            }, this);
            return choice.index;
        }
    });

    /**
     * {@link module:core/factory~Factory|Factory} class for convenience.
     */
    DropdownFieldView.Factory = core.factory.buildFactory(DropdownFieldView);

    
    var AutoCompleteFieldView = FieldView.extend(
    /** @lends module:ui/form/views~AutoCompleteFieldView.prototype */ {
        
        events: _.extend({
            'blur input': 'onBlur',
            'focus input': 'onFocus',
            'select .autocomplete': 'onSelect'
        }, FieldView.prototype.events),
        
        /**
         * AutoCompleteFieldView constructor
         * @constructor
         * @augments module:ui/form/views~FieldView
         * @param {object} options Options object
         * @param {Field} options.field Field object
         * @param {FieldState} options.state Field state model
         * @param {Matcher} options.matcher Autocomplete matcher
         * @param {string} [options.placeholder] Placeholder text
         * @param {number} [options.maxLength=100] Maximum length
         * @param {boolean} [options.trim=true] Boolean indicating that
         *   whitespace should be trimmed from the input.
         * @param {number} [options.throttle=250] Number of milliseconds
         *   following an input change to wait before updating state
         *   model values.
         * @param {boolean} [options.preventDefaultOnEnter=true] Boolean 
         *   indicating that default behavior should be prevented
         *   when the enter key is pressed.
         * @param {string} [options.classes] additional classes to apply
         *   to the <input> element.
         * @param {string} [options.template] View template
         */
        initialize: function(options) {
            options = _.extend({
                template: autocomplete_field_template,
                maxResults: 8,
                placeholder: null,
                maxLength: 100,
                throttle: 250,
                trim: true,
                preventDefaultOnEnter: true,
                classes: null
            }, options);

            AutoCompleteFieldView.__super__.initialize.call(this, options);
            
            this.matcher = options.matcher;
            this.maxResults = options.maxResults;
            this.placeholder = options.placeholder;
            this.maxLength = options.maxLength;
            this.throttle = options.throttle;
            this.defaultSearch = options.defaultSearch;
            this.preventDefaultOnEnter = options.preventDefaultOnEnter;
            this.inputClasses = options.classes;

            //bind events
            this.listenTo(this.state, 'change:rawValue', this.onRawValueChange);
            this.listenTo(this.state, 'change:error', this.render);
            this.listenTo(this.state, 'change:showError', this.render);

            //child views
            this.acView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [this.acView];
        },

        initChildViews: function() {
            this.acView = new ac_views.AutoCompleteView({
                matcher: this.matcher,
                maxResults: this.maxResults,
                throttle: this.throttle,
                trim:  this.trim,
                defaultSearch: this.defaultSearch,
                preventDefaultOnEnter: this.preventDefaultOnEnter,
                forceSelection: true,
                inputView: this,
                inputSelector: 'input'
            });
        },

        classes: function() {
            var result = AutoCompleteFieldView.__super__.classes.call(this);
            result.push('autocomplete-form-field');
            return result;
        },

        context: function() {
            var result = AutoCompleteFieldView.__super__.context.call(this);
            result.placeholder = this.placeholder;
            result.maxLength = this.maxLength;
            result.inputClasses = this.inputClasses;
            return result;
        },

        focus: function() {
            this.acView.focus();
        },

        render: function() {
            var context = this.context();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.acView);
            return this;
        },

        onBlur: function(e) {
            this.validate();
        },

        onFocus: function(e) {
            if(_.isString(this.defaultSearch) &&
               !this.acView.getInputValue()) {
                // give time for input to actually get focus
                // and for click event to propagate past drop view
                setTimeout(_.bind(function() {
                    this.acView.clearCloseOnDelay();
                    this.acView.match(this.defaultSearch);
                }, this), 200);
            }
        },

        onSelect: function(e, eventBody) {
            this.state.setRawValue(eventBody.match);
        },

        onRawValueChange: function(e) {
            this.validate();
            
            var rawValue = this.state.rawValue();

            //if ac match does not match rawValue, update the ac match
            if(rawValue !== null && rawValue !== undefined) {
                var rawString = this.acView.stringify(rawValue) || '';
                var rawInput = this.acView.getInputValue();
                if(rawString.toLowerCase() !== rawInput.toLowerCase()) {
                    this.acView.setMatch(rawValue, false);
                }
            }
        }
    });

    /**
     * {@link module:core/factory~Factory|Factory} class for convenience.
     */
    AutoCompleteFieldView.Factory = core.factory.buildFactory(AutoCompleteFieldView);

    
    var MultiAutoCompleteFieldView = FieldView.extend(
    /** @lends module:ui/form/views~MultiAutoCompleteFieldView.prototype */ {
        
        events: _.extend({
            'select .autocomplete': 'onSelect'
        }, FieldView.prototype.events),
        
        /**
         * MultiAutoCompleteFieldView constructor
         * @constructor
         * @augments module:ui/form/views~FieldView
         * @param {object} options Options object
         * @param {Field} options.field Field object
         * @param {FieldState} options.state Field state model
         * @param {Matcher} options.matcher Autocomplete matcher
         * @param {string} [options.placeholder] Placeholder text
         */
        initialize: function(options) {
            options = _.extend({
                template: multi_autocomplete_field_template,
                maxResults: 8,
                stringify: options.matcher.stringify,
                placeholder: null,
                viewFactory: null
            }, options);

            MultiAutoCompleteFieldView.__super__.initialize.call(
                    this, options);
            
            this.matcher = options.matcher;
            this.stringify = options.stringify;
            this.defaultSearch = options.defaultSearch;
            this.maxResults = options.maxResults;
            this.placeholder = options.placeholder;
            this.viewFactory = options.viewFactory;
            this.collection = this.state.rawValue();

            //bind events
            this.listenTo(this.state, 'change:error', this.render);
            this.listenTo(this.state, 'change:showError', this.render);
            this.listenTo(this.collection, 'add remove reset change',
                    this.onCollectionChange);

            //child views
            this.acView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [this.acView];
        },

        initChildViews: function() {
            this.acView = new ac_views.MultiAutoCompleteView({
                collection: this.state.rawValue(),
                matcher: this.matcher,
                stringify: this.stringify,
                maxResults: this.maxResults,
                placeholder: this.placeholder,
                viewFactory: this.viewFactory,
                defaultSearch: this.defaultSearch
            });
        },

        classes: function() {
            var result = MultiAutoCompleteFieldView.__super__.classes.call(this);
            result.push('multi-autocomplete-form-field');
            return result;
        },

        focus: function() {
            this.acView.focus();
        },

        render: function() {
            var context = this.context();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.acView, '.controls');
            return this;
        },

        onSelect: function(e, eventBody) {
        },

        onCollectionChange: function() {
            this.validate();
        }

    });

    /**
     * {@link module:core/factory~Factory|Factory} class for convenience.
     */
    MultiAutoCompleteFieldView.Factory = core.factory.buildFactory(MultiAutoCompleteFieldView);

    return {
        FieldView: FieldView,
        InputFieldView: InputFieldView,
        DateFieldView: DateFieldView,
        CheckboxFieldView: CheckboxFieldView,
        DropdownFieldView: DropdownFieldView,
        AutoCompleteFieldView: AutoCompleteFieldView,
        MultiAutoCompleteFieldView: MultiAutoCompleteFieldView
    };

});
