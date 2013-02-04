define([
    'jquery',
    'underscore',
    'jquery.validate',
    'core/view',
    'profile/models',
    'lookup/views',
    'text!requisition/req/templates/req.html',
    'text!requisition/req/templates/create_requisition.html',
    'text!requisition/req/templates/read_requisition.html',
    'text!requisition/req/templates/edit_requisition.html',
    'text!requisition/req/templates/requisition_form.html'
], function(
    $,
    _,
    jquery_validate,
    view,
    profile_models,
    lookup_views,
    requisition_template,
    create_requisition_template,
    read_requisition_template,
    edit_requisition_template,
    requisition_form_template) {

    /**
     * Requisition View Events
     */
    var EVENTS = {
        SAVED: 'requisition:Saved',
        CANCELED: 'requisition:Canceled'
    };

    /**
     * Requisition Skills View.
     * @constructor
     * @param {Object} options
     *      collection: {} (optional)
     */
    var RequisitionSkillsView = view.View.extend({
        // TODO
    });

    /**
     * Edit Requisition Skills View.
     * @constructor
     * @param {Object} options
     *      collection: {} (optional)
     */
    var EditRequisitionSkillsView = view.View.extend({
        // TODO
    });

    /**
     * Edit Requisition View.
     * @constructor
     * @param {Object} options
     *  model: {Requisition} (required)
     */
    var EditRequisitionView = view.View.extend({
        //TODO
    });


    /**
     * Requisition Form View.
     * @constructor
     * @param {Object} options
     *   model: {Requisition} (required)
     *   userModel: {User} (required)
     *   statusFormOptions: Array of form option objects (required)
     *   positionTypeFormOptions: Array of form option objects (required)
     */
    var RequisitionFormView = view.View.extend({

        formSelector: '#requisition-form',
        statusSelector: '#inputStatus',
        titleSelector: '#inputTitle',
        locationSelector: '#inputLocation',
        positionTypeSelector: '#inputPositionType',
        salaryStartSelector: '#inputSalaryStart',
        salaryEndSelector: '#inputSalaryEnd',
        descriptionSelector: '#inputDescription',
        employerReqIdSelector: '#inputEmployerReqID',
        telecommuteSelector: '#inputTelecommute',
        relocationSelector: '#inputRelocation',

        events: {
            'click .save': 'onSave',
            'click .cancel': 'onCancel'
        },

        initialize: function(options) {
            this.model = options.model;
            this.userModel = options.userModel;
            this.statusFormOptions = options.statusFormOptions;
            this.positionTypeFormOptions = options.positionTypeFormOptions;
            this.template = _.template(requisition_form_template);

            // for location autocomplete
            this.lookupValue = null; // location text from field
            this.lookupData = null; // location data object
            this.lookupView = null;
        },

        setupValidator: function() {
            this.$(this.formSelector).validate({
                rules: {
                    title: {
                        required: true,
                        minlength: 1,
                        maxlength: 100
                    },
                    salary_start: {
                        required: true,
                        number: true,
                        maxlength: 10
                    },
                    salary_end: {
                        required: true,
                        number: true,
                        maxlength: 10
                    },
                    location: {
                        required: true,
                        minlength: 2,
                        maxlength: 100
                    },
                    description: {
                        required: true,
                        minlength: 1,
                        maxlength: 1024
                    }
                }
            });
        },

        render: function() {
            var context = {
                model: this.model.toJSON({withRelated: true}),
                statusFormOptions: this.statusFormOptions,
                positionTypeFormOptions: this.positionTypeFormOptions
            };
            this.$el.html(this.template(context));

            // setup form validator
            this.setupValidator();

            // setup location autocomplete
            this.lookupView = new lookup_views.LookupView({
                el: this.$(this.locationSelector),
                scope: 'location',
                property: 'name',
                forceSelection: true,
                onenter: this.updateLocationData,
                onselect: this.updateLocationData,
                context: this
            });
            return this;
        },

        /**
         * Callback to be invoked when when user selects a location
         * from the typeahead view
         * @param value  the string in the LookupView input
         * @param data  the LookupResult.matches object which is scope/category specific
         */
        updateLocationData: function(value, data) {
            this.lookupValue = value;
            this.lookupData = data;
            this.location = new profile_models.LocationPreference({
                locationId: data.id,
                city: data.city,
                state: data.state,
                zip: data.zip,
                country: data.country
            });
        },

        /**
         * Method to retrieve location data object
         * @return Returns LocationPreference object or null
         * if no object is available
         */
        getLocation: function() {
            var ret = null;
            var value = this.$(this.locationSelector).val();
            if (value.toLowerCase() === this.lookupData.name.toLowerCase()) {
                // If this check passes, it implies that the value of this.lookupValue & this.lookupData
                // are up-to-date and accurate.  This is to prevent a time-of-check versus time-of-use
                // bug.  This could occur if the user had selected an option in from the drop down menu,
                // then edited the location data within the field and finally pressed the 'add' button.
                ret = this.lookupData;
            }
            return ret;
        },

        onSave: function() {
            var that = this;
            this.model.save({
                user_id: this.userModel.id,
                tenant_id: this.userModel.get_tenant_id(),
                status: this.$(this.statusSelector).val(),
                title: this.$(this.titleSelector).val(),
                position_type: this.$(this.positionTypeSelector).val(),
                salary_start: this.$(this.salaryStartSelector).val(),
                salary_end: this.$(this.salaryEndSelector).val(),
                location_id: this.getLocation().id,
                description: this.$(this.descriptionSelector).val(),
                employer_requisition_identifier: this.$(this.employerReqIdSelector).val(),
                telecommute: this.$(this.telecommuteSelector).is(":checked"),
                relocation: this.$(this.relocationSelector).is(":checked")
            }, {
                success: function(model) {
                    var eventBody = {
                        id: model.id
                    };
                    that.triggerEvent(EVENTS.SAVED, eventBody);
                }
            });
        },

        onCancel: function() {
            var eventBody = {};
            this.triggerEvent(EVENTS.CANCELED, eventBody);
        }
    });

    /**
     * Create Requisition View.
     * @constructor
     * @param {Object} options
     *   model: {Requisition} (required)
     *   userModel: {User} (required)
     *   statusFormOptions: Array of form option objects (required)
     *   positionTypeFormOptions: Array of form option objects (required)
     */
    var CreateRequisitionView = view.View.extend({

        formContainerSelector: '#req-form-container',

        childViews: function() {
            return [this.reqFormView];
        },

        initialize: function(options) {
            this.model = options.model;
            this.userModel = options.userModel;
            this.statusFormOptions = options.statusFormOptions;
            this.positionTypeFormOptions = options.positionTypeFormOptions;
            this.template = _.template(create_requisition_template);

            // child views
            this.reqFormView = null;
        },

        render: function() {
            this.$el.html(this.template());

            this.reqFormView = new RequisitionFormView({
                el: this.$(this.formContainerSelector),
                model: this.model,
                userModel: this.userModel,
                statusFormOptions: this.statusFormOptions,
                positionTypeFormOptions: this.positionTypeFormOptions
            }).render();

            return this;
        }
    });

    /**
     * Read Requisition View.
     * @constructor
     * @param {Object} options
     *   model: Requisition model (required)
     */
    var ReadRequisitionView = view.View.extend({

        initialize: function(options) {
            this.model = options.model;
            this.template = _.template(read_requisition_template);

            // bindings
            this.model.bind('change', this.render, this);
            this.model.bind('loaded', this.loaded, this);

            if(!this.model.isLoading()) {
                this.load();
            }
        },

        loaded: function(instance) {
            //Cover case where model was already loading at time of view
            //creation, but not all necessary data was loaded. Invoking
            //load again will ensure all necessary data is loaded. If
            //all data is already loaded, this is a no-op.
            this.load();
        },

        load: function() {
            var state = this.model.isLoadedWith(
                "location",
                "requisition_technologies"
            );
            if (!state.loaded) {
                state.fetcher({
                    success: _.bind(this.render, this)
                });
            }
        },

        render: function() {
            var context = {
                fmt: this.fmt,
                model: this.model.toJSON({withRelated: true})
            };
            this.$el.html(this.template(context));
            return this;
        }
    });

    /**
     * Requisition main view.
     * @constructor
     * @param {Object} options
     *   action: String specifying which action the user
     *      would like to perform. Valid values:
     *          'read',
     *          'edit',
     *          'create'
     *   model: {Requisition} (required)
     *   userModel: {User} (required)
     */
    var RequisitionView = view.View.extend({

        events: {
        },

        requisition_view_selector: '#requisition-container',

        childViews: function() {
            return [this.requisitionView];
        },

        initialize: function(options) {
            this.action = options.action; // read, create, or edit req
            this.model = options.model;
            this.userModel = options.userModel;
            this.template =  _.template(requisition_template);

            // generate form options
            this._generateRequisitionFormOptions();

            // bindings
            // TODO verify bindings
            this.model.bind('loaded', this.loaded, this);

            // child views
            this.requisitionView = null;

            if(!this.model.isLoading()) {
                this.load();
            }
        },

        _generateRequisitionFormOptions: function() {
            // Requistion Status
            var statusOpen = {
                option: "Open", // shown in UI
                value: "OPEN"   // returned value
            };
            var statusClosed = {
                option: "Closed", // shown in UI
                value: "CLOSED"   // returned value
            };
            this.statusFormOptions = [statusOpen, statusClosed];

            // Postion Types
            var positionTypeJuniorDeveloper = {
                option: "Junior Developer",
                value: "Junior Developer"
            };
            var positionTypeSeniorDeveloper = {
                option: "Senior Developer",
                value: "Senior Developer"
            };
            var positionTypeTeamLead = {
                option: "Team Lead",
                value: "Team Lead"
            };
            this.positionTypeFormOptions = [
                positionTypeJuniorDeveloper,
                positionTypeSeniorDeveloper,
                positionTypeTeamLead
            ];
        },

        loaded: function(instance) {
            if(instance === this.model) {
                this.load();
            }
        },

        load: function() {
            // Only require loading the model if a
            // non-empty model was passed to this view
            if (this.model.id) {
                var state = this.model.isLoadedWith(
                    "location",
                    "requisition_technologies"
                );
                if (!state.loaded) {
                    state.fetcher({
                        success: _.bind(this.render, this)
                    });
                }
            }

        },

        render: function() {
            _.each(this.childViews, function(view) {
                view.destroy();
            });

            this.$el.html(this.template());

            // TODO does it make more sense for the mediator to hvae this logic? What purpose does this parent view serve?

            // Need to determine if user is reading,
            // editing, or creating a requisition
            if (this.action === 'create') {
                this.requisitionView = new CreateRequisitionView({
                    el: this.$(this.requisition_view_selector),
                    model: this.model,
                    userModel: this.userModel,
                    statusFormOptions: this.statusFormOptions,
                    positionTypeFormOptions: this.positionTypeFormOptions
                }).render();
            }
            else if (this.action == 'edit') {
                this.requisitionView = new EditRequisitionView({
                    el: this.$(this.requisition_view_selector),
                    model: this.model,
                    userModel: this.userModel,
                    statusFormOptions: this.statusFormOptions,
                    positionTypeFormOptions: this.positionTypeFormOptions
                }).render();
            }
            else if (this.action === 'read') {
                this.requisitionView = new ReadRequisitionView({
                    el: this.$(this.requisition_view_selector),
                    model: this.model
                }).render();
            }

            return this;
        }
    });

    return {
        EVENTS: EVENTS,
        RequisitionView: RequisitionView
    };
});
