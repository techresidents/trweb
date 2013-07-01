define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'ui',
    'events',
    'text!./templates/form_skill.html',
    'text!./templates/form_skill_drop.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    ui,
    events,
    form_skill_template,
    form_skill_drop_template) {
    
    /**
     * Account Form View
     * @constructor
     * @param {Object} options
     */
    var AccountFormView = ui.form.views.FormView.extend({

        initialize: function(options) {
            options = _.extend({
                legend: '<strong>Account </strong>' +
                        '<small class="muted">' +
                        'update your basic account info</small>'
            }, options);

            options.fields = [
                this.firstNameField(options.model),
                this.lastNameField(options.model),
                this.emailField(options.model),
                this.timezoneField(options.model),
                //this.developerSinceField(options.model),
                this.locationField(options.model)
            ];

            options.actions = [
                new ui.form.actions.ButtonAction({
                    label: 'Save',
                    primary: true,                        
                    handler: _.bind(this.onSave, this)
                })
            ];
            
            AccountFormView.__super__.initialize.call(this, options);
        },

        firstNameField: function(model) {
            return new ui.form.fields.InputField({
                name: 'first_name',
                model: model,
                label: 'First Name'
            });
        },

        lastNameField: function(model) {
            return new ui.form.fields.InputField({
                name: 'last_name',
                model: model,
                label: 'Last Name'
            });
        },

        emailField: function(model) {
            return new ui.form.fields.InputField({
                name: 'email',
                model: model,
                label: 'Email',
                enabled: false
            });
        },

        timezoneField: function(model) {
            return new ui.form.fields.DropdownField({
                name: 'timezone',
                model: model,
                label: 'Time zone',
                choices: [
                    { label: '(GMT-10:00) Hawaii Time', value: 'US/Hawaii' },
                    { label: '(GMT-09:00) Alaska Time', value: 'US/Alaska' },
                    { label: '(GMT-08:00) Pacafic Time', value: 'US/Pacafic' },
                    { label: '(GMT-07:00) Mountain Time', value: 'US/Mountain' },
                    { label: '(GMT-07:00) Mountain Time - Arizona', value: 'US/Arizona' },
                    { label: '(GMT-06:00) Central Time', value: 'US/Central' },
                    { label: '(GMT-05:00) Eastern Time', value: 'US/Eastern' }
                ]
            });
        },

        developerSinceField: function(model) {
            var currentYear = (new Date()).getFullYear();
            var  choices = _.map(_.range(0, 50), function(i) {
                var year = currentYear - i;
                var date = new Date(Date.UTC(year, 0, 1));
                date = new core.date.DateTime(date);
                return {label: year, value: date};
            });

            choices = [{label: '', value: null}].concat(choices);

            return new ui.form.fields.DropdownField({
                name: 'developer_profile__developer_since',
                model: model,
                label: 'Proud developer since',
                required: false,
                choices: choices
            });
        },

        locationField: function(model) {
            //build query factory
            var queryFactory = function(options) {
                var collection = new api.models.LocationSearchCollection();
                var query = collection.filterBy({
                    ac: options.search
                }).slice(0, options.maxResults);
                return query;
            };
            queryFactory = new core.factory.FunctionFactory(queryFactory);

            //matcher map function to convert location search
            //model to a string
            var map = function(locationSearchModel) {
                return locationSearchModel.get_region();
            };
            
            //convert string or model to string
            var stringify = function(stringOrModel) {
                var result = stringOrModel;
                if(stringOrModel instanceof api.models.LocationSearch) {
                    result = stringOrModel.get_region();
                }
                return result;
            };
            
            //match which will return location string to ac view
            var matcher = new ui.ac.matcher.QueryMatcher({
                queryFactory: queryFactory,
                map: map,
                stringify: stringify
            });

            
            return new ui.form.fields.AutoCompleteField({
                name: 'developer_profile__location',
                model: model,
                label: 'Location',
                matcher: matcher,
                placeholder: 'Boston, New York',
                maxResults: 20,
                required: false,
                viewOptions: { defaultSearch: '' }
            });
        },

        onSave: function(options) {
            this.triggerEvent(events.UPDATE_DEVELOPER_ACCOUNT, {
                model: this.model,
                onSuccess: options.success,
                onError: options.error
            });
        }
    });

    /**
     * Preferences Form View
     * @constructor
     * @param {Object} options
     */
    var PreferencesFormView = ui.form.views.FormView.extend({

        initialize: function(options) {
            options = _.extend({
                legend: '<strong>Preferences </strong>' +
                        '<small class="muted">' +
                        'update your job preferences</small>',
                horizontal: false
            }, options);

            options.fields = [
                this.positionPrefsField(options.model),
                this.technologyPrefsField(options.model),
                this.locationPrefsField(options.model)
            ];

            options.actions = [
                new ui.form.actions.ButtonAction({
                    label: 'Save',
                    primary: true,                        
                    handler: _.bind(this.onSave, this)
                })
            ];
            
            PreferencesFormView.__super__.initialize.call(this, options);
        },

        positionPrefsField: function(model) {
            var data = [
                new api.models.PositionPref({type: 'Junior Developer' }),
                new api.models.PositionPref({type: 'Senior Developer' }),
                new api.models.PositionPref({type: 'Team Lead' })
            ];

            var matcher = new ui.ac.matcher.ArrayMatcher({
                data: data,
                stringify: function(pref) {
                    return pref.get_type();
                }
            });

            var label = '<strong>Positions</strong> ' +
                        '<span class="muted">you want';
            
            return new ui.form.fields.MultiAutoCompleteField({
                name: 'position_prefs',
                model: model,
                label: label,
                placeholder: 'Junior Developer, Senior Developer, Team Lead',
                matcher: matcher,
                viewOptions: { defaultSearch: '' }
            });
        },

        technologyPrefsField: function(model) {
            //build query factory
            var queryFactory = function(options) {
                var collection = new api.models.TechnologySearchCollection();
                var query = collection.filterBy({
                    ac: options.search
                }).slice(0, options.maxResults);
                return query;
            };
            queryFactory = new core.factory.FunctionFactory(queryFactory);

            //matcher map function to convert technology search
            //model to a technology pref model.
            var map = function(technologySearchModel) {
                var pref = new api.models.TechnologyPref({
                    technology_id: technologySearchModel.id
                });
                pref.set_technology(new api.models.Technology({
                    id: technologySearchModel.id,
                    name: technologySearchModel.get_name(),
                    type: technologySearchModel.get_type()
                }));
                return pref;
            };
            
            //matcher which will return technology pref
            //models to ac view
            var matcher = new ui.ac.matcher.QueryMatcher({
                queryFactory: queryFactory,
                map: map,
                stringify: function(technologySearchModel) {
                    return technologySearchModel.get_name();
                }
            });

            //stringify method to convert technology pref
            //model to string in ac view
            var stringify = function(pref) {
                return pref.get_technology().get_name();
            };

            
            var label = '<strong>Technologies</strong> ' +
                        '<span class="muted">you want to work with</span>';

            return new ui.form.fields.MultiAutoCompleteField({
                name: 'technology_prefs',
                model: model,
                label: label,
                matcher: matcher,
                placeholder: 'Python, Ruby, C++',
                viewOptions: { stringify: stringify },
                storeOptions: {withRelated: ['technology'] }
            });
        },

        locationPrefsField: function(model) {

            //build query factory
            var queryFactory = function(options) {
                var collection = new api.models.LocationSearchCollection();
                var query = collection.filterBy({
                    ac: options.search
                }).slice(0, options.maxResults);
                return query;
            };
            queryFactory = new core.factory.FunctionFactory(queryFactory);

            //matcher map function to convert location search
            //model to a location pref model.
            var map = function(locationSearchModel) {
                var pref = new api.models.LocationPref({
                    location_id: locationSearchModel.id
                });
                pref.set_location(new api.models.Location({
                    id: locationSearchModel.id,
                    region: locationSearchModel.get_region()
                }));
                return pref;
            };
            
            //match which will return location pref model
            //to ac view
            var matcher = new ui.ac.matcher.QueryMatcher({
                queryFactory: queryFactory,
                map: map,
                stringify: function(locationSearchModel) {
                    return locationSearchModel.get_region();
                }
            });
            
            //stringify method to convert location pref
            //model to string in ac view
            var stringify = function(pref) {
                return pref.get_location().get_region();
            };


            var label = '<strong>Locations</strong> ' +
                        '<span class="muted">you want to work in</span>';
            
            return new ui.form.fields.MultiAutoCompleteField({
                name: 'location_prefs',
                model: model,
                label: label,
                matcher: matcher,
                placeholder: 'Boston, New York',
                maxResults: 20,
                viewOptions: { defaultSearch: '', stringify: stringify },
                storeOptions: {withRelated: ['location'] }
            });
        },

        onSave: function(options) {
            this.triggerEvent(events.UPDATE_DEVELOPER_PREFERENCES, {
                model: this.model,
                onSuccess: options.success,
                onError: options.error
            });
        }
    });

    var FormSkillsFieldView = ui.form.views.MultiAutoCompleteFieldView.extend({

        /**
         * FormSkillsFieldView constructor
         * @constructor
         * @augments module:ui/form/views~FieldView
         * @param {object} options Options object
         * @param {Field} options.field Field object
         * @param {FieldState} options.state Field state model
         * @param {Matcher} options.matcher Autocomplete matcher
         * @param {string} [options.placeholder] Placeholder text
         */
        initialize: function(options) {
            FormSkillsFieldView.__super__.initialize.call(this, options);
        },

        initChildViews: function() {
            this.acView = new FormSkillsView({
                collection: this.state.rawValue(),
                matcher: this.matcher,
                stringify: this.stringify,
                maxResults: this.maxResults,
                placeholder: this.placeholder,
                viewFactory: this.viewFactory,
                defaultSearch: this.defaultSearch
            });
        }
    });

    /**
     * {@link module:core/factory~Factory|Factory} class for convenience.
     */
    FormSkillsFieldView.Factory = core.factory.buildFactory(FormSkillsFieldView);


    /**
     * Form Skills View
     * @constructor
     * @param {Object} options
     */
    var FormSkillsView = ui.ac.views.MultiAutoCompleteView.extend({

        events: function() {
            return _.extend({
                'close .form-skill': 'onFormSkillClose'
            }, FormSkillsView.__super__.events);
        },

        initialize: function(options) {
            options.viewFactory = new FormSkillView.Factory();

            this.listenTo(this.collection, 'change', this.onChange);

            FormSkillsView.__super__.initialize.call(this, options);
        },

        initChildViews: function() {
            this.sort = _.bind(this.sortSkill, this);
            FormSkillsView.__super__.initChildViews.call(this);
            this.sort = null;
        },

        addMatch: function(match) {
            var model = FormSkillsView.__super__.addMatch.call(this, match);
            var view = this.modelViewMap[model.cid];

            //delay opeing skill drop view so we don't lose
            //focus to the autocomplete view
            setTimeout( function() {
                view.open();
                view.focus();
            }, 100);
        },

        sortSkill: function(view) {
            var skill = view.model;
            var expertise = 1;
            var yrs_experience = skill.get_yrs_experience() || 1;
            switch(skill.get_expertise()) {
                case 'Proficient':
                    expertise = 2;
                    break;
                case 'Expert':
                    expertise = 3;
                    break;
            }
            return -1 * (expertise*100 + yrs_experience);
        },

        onInputFocus: function(e) {
            this._closeSkillViews();
            FormSkillsView.__super__.onInputFocus.call(this, e);
        },

        onChange: function() {
            this.sortChildViews();
        },

        onFormSkillClose: function(e) {
            //deterime if any of the skill views are open.
            //this will happen if a click on a new skill
            //is closing a previously open skill.
            var isOpen = false;
            _.each(this.childViews, function(view) {
                if(view.isOpen()) {
                    isOpen = true;
                }
            }, this);
            
            //if no skills are open set focus on input
            if(!isOpen) {
                this.focus();
            }
        },

        _closeSkillViews: function() {
            _.each(this.childViews, function(skillView) {
                skillView.close();
            }, this);
        }
    });
    
    /**
     * Form Skill View
     * @constructor
     * @param {Object} options
     */
    var FormSkillView = core.view.View.extend({

        events: {
            'click .form-skill-container': 'onContainerClick',
            'click .form-skill-drop': 'onDropClick',
            'click .form-skill-drop .close': 'onDropCloseClick',
            'keydown .form-skill-drop': 'onDropKeyDown',
            'open .drop': 'onOpen',
            'close .drop': 'onClose'
        },

        initialize: function(options) {

            this.model = options.model;
            this.template = _.template(form_skill_template);

            //bind events
            this.listenTo(this.model, 'change', this.onChange);

            //child views
            this.skillDropView = null;
            this.dropView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.skillDropView = new FormSkillDropView({
                model: this.model
            });

            this.dropView = new ui.drop.views.DropView({
                view: this.skillDropView,
                targetView: this.$el
            });
        },

        childViews: function() {
            return [this.dropView];
        },

        context: function() {
            return this.model.toJSON({
                withRelated: ['technology']
            });
        },

        classes: function() {
            var result = ['form-skill'];
            var expertise = this.model.get_expertise();
            if(expertise) {
                result.push('form-skill-' + expertise.toLowerCase());
            }
            if(this.dropView.isOpen()) {
                result.push('open');
            }
            return result;
        },

        applyClasses: function() {
            this.$el.attr('class', this.classes().join(' '));
        },

        render: function() {
            var context = this.context();
            this.$el.html(this.template(context));
            this.applyClasses();
            this.append(this.dropView);
            return this;
        },

        focus: function() {
            if(this.isOpen()) {
                this.skillDropView.focus();
            } else {
                this.$el.focus();
            }
        },

        isOpen: function() {
            return this.dropView.isOpen();
        },

        open: function() {
            this.dropView.open();
        },

        close: function() {
            this.dropView.close();
        },

        onContainerClick: function(e) {
            //prevent click in container from setting focus
            //on the autocomplete
            e.stopPropagation();
            this.dropView.toggle();
        },

        onDropClick: function(e) {
            //prevent click in drop from toggling the
            //dropdown or setting focus to autocomplete
            e.stopPropagation();
        },

        onDropCloseClick: function(e) {
            this.dropView.close();
        },

        onDropKeyDown: function(e) {
            switch(e.keyCode) {
                case ui.events.kc.ESC:
                case ui.events.kc.ENTER:
                    this.close();
                    break;
            }
        },

        onOpen: function(e) {
            this.applyClasses();
            this.skillDropView.focus();
        },

        onClose: function(e) {
            this.model.set({
                expertise: this.skillDropView.getExpertise(),
                yrs_experience: this.skillDropView.getYearsExperience()
            });
            this.applyClasses();
        },

        onChange: function() {
            var experience = this.model.get_yrs_experience();
            this.$('.form-skill-experience').text('(' + experience + ')');
            this.applyClasses();
        }
    });

    
    /**
     * Form Skill Drop View
     * @constructor
     * @param {Object} options
     */
    var FormSkillDropView = core.view.View.extend({

        events: {
            'change select': 'onSelectChange',
            'click button': 'onButtonClick'

        },

        initialize: function(options) {

            this.model = options.model;
            this.template = _.template(form_skill_drop_template);
        },

        context: function() {
            return this.model.toJSON({
                withRelated: ['technology']
            });
        },

        classes: function() {
            return ['form-skill-drop'];
        },

        render: function() {
            var context = this.context();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));

            //set tab index so we generate keypress events
            //so drop can be closed by parent view
            this.$el.attr('tabindex', '1');
            return this;
        },

        focus: function() {
            this.$('select').focus();
        },

        getYearsExperience: function() {
            var target = this.$('option:selected');
            return target.val();
        },

        getExpertise: function() {
            var target = this.$('button.active');
            return target.val();
        },

        onSelectChange: function(e) {
            var target = this.$(e.currentTarget);
            var value = target.val();
            this.model.set_yrs_experience(value);
        },

        onButtonClick: function(e) {
            var target = this.$(e.currentTarget);
            this.$('button').removeClass('active');
            target.addClass('active');
            var value = target.val();
            this.model.set_expertise(value);
        }
    });


    /**
     * {@link module:core/factory~Factory|Factory} class for convenience.
     */
    FormSkillView.Factory = core.factory.buildFactory(FormSkillView);

    /**
     * Skills Form View
     * @constructor
     * @param {Object} options
     */
    var SkillsFormView = ui.form.views.FormView.extend({

        initialize: function(options) {
            options = _.extend({
                legend: '<strong>Skills </strong>' +
                        '<small class="muted">' +
                        'update your skills</small>',
                horizontal: false
            }, options);

            options.fields = [
                this.skillsField(options.model)
            ];

            options.actions = [
                new ui.form.actions.ButtonAction({
                    label: 'Save',
                    primary: true,                        
                    handler: _.bind(this.onSave, this)
                })
            ];
            
            SkillsFormView.__super__.initialize.call(this, options);
        },

        skillsField: function(model) {
            //build query factory
            var queryFactory = function(options) {
                var collection = new api.models.TechnologySearchCollection();
                var query = collection.filterBy({
                    ac: options.search
                }).slice(0, options.maxResults);
                return query;
            };
            queryFactory = new core.factory.FunctionFactory(queryFactory);

            //matcher map function to convert technology search
            //model to a skill model.
            var map = function(technologySearchModel) {
                var skill = new api.models.Skill({
                    technology_id: technologySearchModel.id,
                    expertise: 'Proficient',
                    yrs_experience: 1
                });
                skill.set_technology(new api.models.Technology({
                    id: technologySearchModel.id,
                    name: technologySearchModel.get_name(),
                    type: technologySearchModel.get_type()
                }));
                return skill;
            };

            var stringify = function(skill) {
                return skill.get_technology().get_name();
            };

            var matcher = new ui.ac.matcher.QueryMatcher({
                queryFactory: queryFactory,
                map: map,
                stringify: function(technologySearchModel) {
                    return technologySearchModel.get_name();
                }
            });

            return new ui.form.fields.MultiAutoCompleteField({
                name: 'skills',
                model: model,
                label: '<strong>Skills</strong>',
                matcher: matcher,
                placeholder: 'Python, Ruby, C++',
                viewFactory: new FormSkillsFieldView.Factory(),
                viewOptions: { stringify: stringify },
                storeOptions: {withRelated: ['technology'] }
            });
        },

        onSave: function(options) {
            this.triggerEvent(events.UPDATE_SKILLS, {
                collection: this.model.get_skills(),
                onSuccess: options.success,
                onError: options.error
            });
        }
    });

    return {
        AccountFormView: AccountFormView,
        PreferencesFormView: PreferencesFormView,
        SkillsFormView: SkillsFormView
    };
});
