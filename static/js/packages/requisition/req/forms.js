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
     * Requisition Form View
     * @constructor
     * @param {Object} options
     */
    var RequisitionFormView = ui.form.views.FormView.extend({

        initialize: function(options) {

            options.fields = [
                this.titleField(options.model),
                this.statusField(options.model),
                this.positionTypeField(options.model),
                this.locationField(options.model),
                this.salaryField(options.model),
                this.equityField(options.model),
                this.relocationField(options.model),
                this.telecommuteField(options.model),
                this.wishlistField(options.model),
                this.descriptionField(options.model)
            ];

            options.actions = [
                new ui.form.actions.ButtonAction({
                    label: 'Save',
                    primary: true,                        
                    handler: _.bind(this.onSave, this)
                })
            ];
            
            RequisitionFormView.__super__.initialize.call(this, options);
        },

        classes: function() {
            result = RequisitionFormView.__super__.classes.call(this);
            result.push('form-requisition');
            return result;
        },

        titleField: function(model) {
            return new ui.form.fields.InputField({
                name: 'title',
                model: model,
                label: 'Title',
                placeholder: 'Full Stack Developer'
            });
        },

        statusField: function(model) {
            return new ui.form.fields.DropdownField({
                name: 'status',
                model: model,
                label: 'Status',
                choices: [
                    { label: 'OPEN', value: 'OPEN' },
                    { label: 'CLOSED', value: 'CLOSED' }
                ]
            });
        },

        positionTypeField: function(model) {
            return new ui.form.fields.DropdownField({
                name: 'position_type',
                model: model,
                label: 'Position',
                choices: [
                    { label: '', value: null },
                    { label: 'Intern', value: 'Intern' },
                    { label: 'Junior Developer', value: 'Junior Developer' },
                    { label: 'Senior Developer', value: 'Senior Developer' },
                    { label: 'Team Lead', value: 'Team Lead' }
                ]
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
                name: 'location',
                model: model,
                label: 'Location',
                matcher: matcher,
                placeholder: 'Boston, New York',
                maxResults: 20,
                viewOptions: { defaultSearch: '' }
            });
        },

        salaryField: function(model) {
            return new ui.form.fields.InputField({
                name: 'salary',
                model: model,
                label: 'Salary',
                placeholder: '$100,000 - $125,000'
            });
        },

        equityField: function(model) {
            return new ui.form.fields.InputField({
                name: 'equity',
                model: model,
                label: 'Equity',
                placeholder: '2%',
                required: false
            });
        },

        descriptionField: function(model) {
            return new ui.form.fields.TextField({
                name: 'description',
                model: model,
                label: 'Description',
                placeholder: 'Job Description',
                rows: 9,
                viewOptions: {classes: 'input-xxlarge'}
            });
        },

        wishlistField: function(model) {
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
            //model to a RequisitionTechnology  model.
            var map = function(technologySearchModel) {
                var requisitionTechnology = new api.models.RequisitionTechnology({
                    technology_id: technologySearchModel.id,
                    expertise: 'Proficient',
                    yrs_experience: 1
                });
                requisitionTechnology.set_technology(new api.models.Technology({
                    id: technologySearchModel.id,
                    name: technologySearchModel.get_name(),
                    type: technologySearchModel.get_type()
                }));
                return requisitionTechnology;
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
                name: 'requisition_technologies',
                model: model,
                label: 'Wishlist',
                matcher: matcher,
                placeholder: 'Python, Agile, Web, Mobile',
                viewFactory: new widget.skill.views.SkillsFieldView.Factory(),
                viewOptions: { stringify: stringify },
                storeOptions: {withRelated: ['technology'] }
            });
        },

        relocationField: function(model) {
            return new ui.form.fields.CheckboxField({
                name: 'relocation',
                model: model,
                label: 'Relocation'
            });
        },

        telecommuteField: function(model) {
            return new ui.form.fields.CheckboxField({
                name: 'telecommute',
                model: model,
                label: 'Telecommute'
            });
        },

        onSave: function(options) {
            var success = function() {
                options.success.apply(this, arguments);
                this.triggerEvent(events.VIEW_NAVIGATE, {
                    type: 'RequisitionReadView',
                    id: this.model.id
                });
            };

            this.triggerEvent(events.SAVE_REQUISITION, {
                model: this.model,
                onSuccess: _.bind(success, this),
                onError: options.error
            });
        }
    });

    return {
        RequisitionFormView: RequisitionFormView
    };
});
