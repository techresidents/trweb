define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'ui',
    'widget',
    'events'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    ui,
    widget,
    events) {

    /**
     * General Form View
     * @constructor
     * @param {Object} options
     * @param {DeveloperProfile} DeveloperProfile model
     * @classdesc
     * Form view to edit general preferences
     */
    var GeneralFormView = ui.form.views.FormView.extend({

        initialize: function(options) {

            /*
            Hiding the legend. Leaving code snippet as reference for future.
            options = _.extend({
                legend: '<strong>Account </strong>' +
                        '<small class="muted">' +
                        'update your basic account info</small>'
            }, options);
            */

            options = _.extend({
                horizontal: false
            }, options);

            options.fields = [
                this.activelySeekingField(options.model)
            ];

            options.actions = [
                new ui.form.actions.ButtonAction({
                    label: 'Save',
                    primary: true,
                    handler: _.bind(this.onSave, this)
                })
            ];

            GeneralFormView.__super__.initialize.call(this, options);
        },

        activelySeekingField: function(model) {
            return new ui.form.fields.CheckboxField({
                name: 'actively_seeking',
                model: model,
                label: 'I am actively job hunting'
            });
        },

        onSave: function(options) {
            this.triggerEvent(events.UPDATE_DEVELOPER_PROFILE, {
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
                horizontal: false
            }, options);

            options.fields = [
                this.positionPrefsField(options.model),
                this.locationPrefsField(options.model),
                this.technologyPrefsField(options.model)
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
                new api.models.PositionPref({type: 'Team Lead' }),
                new api.models.PositionPref({type: 'Intern' })
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
                placeholder: 'Intern, Developer, Team Lead',
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

    
    /**
     * Skills Form View
     * @constructor
     * @param {Object} options
     */
    var SkillsFormView = ui.form.views.FormView.extend({

        initialize: function(options) {
            options = _.extend({
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
                placeholder: 'Python, Agile, Web, Mobile',
                viewFactory: new widget.skill.views.SkillsFieldView.Factory(),
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
        GeneralFormView: GeneralFormView,
        PreferencesFormView: PreferencesFormView,
        SkillsFormView: SkillsFormView
    };
});
