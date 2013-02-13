define([
    'jquery',
    'underscore',
    'jquery.validate',
    'core/view',
    'api/models',
    'profile/models',
    'lookup/views',
    'text!requisition/req/templates/req.html',
    'text!requisition/req/templates/requisition_create.html',
    'text!requisition/req/templates/requisition_read.html',
    'text!requisition/req/templates/requisition_edit.html',
    'text!requisition/req/templates/requisition_form.html',
    'text!requisition/req/templates/wishlist.html',
    'text!requisition/req/templates/wishlist_item_edit.html',
    'text!requisition/req/templates/wishlist_item.html',
    'text!requisition/req/templates/wishlist_add_item.html'
], function(
    $,
    _,
    jquery_validate,
    view,
    api_models,
    profile_models, // TODO reference api models
    lookup_views,
    requisition_template,
    create_requisition_template,
    read_requisition_template,
    edit_requisition_template,
    requisition_form_template,
    wishlist_template,
    edit_wishlist_item_template,
    wishlist_item_template,
    wishlist_add_item_template) {

    /**
     * Requisition View Events
     */
    var EVENTS = {
        SAVED: 'requisition:Saved',
        SAVE_FAILED: 'requisition:SaveFailed',
        CANCELED: 'requisition:Canceled',
        WISHLIST_ITEM_REMOVED: 'requisition:WishlistItemRemoved'
    };

    /**
     * Requisition Wishlist Item View.
     * @constructor
     * @param {Object} options
     *      model: {RequisitionTechnology} (required)
     */
    var WishlistItemView = view.View.extend({

        initialize: function(options) {
            this.model = options.model;
            this.template = _.template(wishlist_item_template);
            this.listenTo(this.model, 'change', this.changed);
            this.listenTo(this.model, 'loaded', this.loaded);

            if (!this.model.isLoading()) {
                this.load();
            }
        },

        loaded: function(instance) {
            //Cover case where model was already loading at time of view
            //creation, but not all necessary data was loaded. Invoking
            //load again will ensure all necessary data is loaded. If
            //all data is already loaded, this is a no-op.
            console.log('WishlistItemView loaded');
            if (instance === this.model) {
                this.load();
            }
        },

        load: function() {
            var state = this.model.isLoadedWith('technology');
            if (!state.loaded) {
                state.fetcher({
                    success: _.bind(this.render, this)
                });
            }
        },

        changed: function() {
            console.log('WishlistItemView detected model change event');
            this.render();
        },

        render: function() {
            console.log('WishlistItemView render');
            var context = {
                model: this.model.toJSON({withRelated: true})
            };
            this.$el.html(this.template(context));
            this.$('[rel=tooltip]').tooltip(); // Activate tooltips
            return this;
        }
    });

    /**
     * Edit Requisition Wishlist Item View.
     * @constructor
     * @param {Object} options
     *      model: {RequisitionTechnology} (required)
     */
    var EditWishlistItemView = view.View.extend({

        events: {
            'click .destroy': 'onDestroy',
            'click .arrow.up': 'onUpArrow',
            'click .arrow.down': 'onDownArrow'
        },

        initialize: function(options) {
            this.model = options.model;
            this.template = _.template(edit_wishlist_item_template);
            this.listenTo(this.model, 'change', this.changed);
            this.listenTo(this.model, 'loaded', this.loaded);

            if (!this.model.isLoading()) {
                this.load();
            }
        },

        loaded: function(instance) {
            //Cover case where model was already loading at time of view
            //creation, but not all necessary data was loaded. Invoking
            //load again will ensure all necessary data is loaded. If
            //all data is already loaded, this is a no-op.
            console.log('EditWishlistItemView loaded');
            if (instance === this.model) {
                this.load();
            }
        },

        load: function() {
            var state = this.model.isLoadedWith('technology');
            if (!state.loaded) {
                state.fetcher({
                    success: _.bind(this.render, this)
                });
            }
        },

        onDestroy: function() {
            console.log('onDestroy');
            var eventBody = {
                model: this.model
            };
            this.triggerEvent(EVENTS.WISHLIST_ITEM_REMOVED, eventBody);
        },

        onUpArrow: function() {
            // Need to hide tooltip since this view will be removed
            // from the DOM before the mouseleave() event fires
            this.$("[rel=tooltip]").tooltip('hide');
            var yrs = this.model.get_yrs_experience();
            this.model.set_yrs_experience(yrs + 1);
        },

        onDownArrow: function() {
            // Need to hide tooltip since this view will be removed
            // from the DOM before the mouseleave() event fires
            this.$("[rel=tooltip]").tooltip('hide');
            var yrs = this.model.get_yrs_experience();
            // minimum of 1 yr experience
            if (yrs > 1) {
                this.model.set_yrs_experience(yrs - 1);
            }
        },

        changed: function() {
            console.log('EditWishlistItemView detected model change event');
            this.render();
        },

        render: function() {
            console.log('EditWishlistItemView render');
            var context = {
                model: this.model.toJSON({withRelated: true})
            };
            this.$el.html(this.template(context));
            this.$('[rel=tooltip]').tooltip(); // Activate tooltips
            return this;
        }
    });

    /**
     * Edit List View.
     * @constructor
     * @param {Object} options
     *      model: {Requisition} (required)
     *      collection: Copy of {RequisitionTechnologyCollection} (required)
     */
    var EditListView = view.View.extend({

        // TODO Does it make sense to not check if the collection is loaded
        // since this is just a local copy of the data?

        events: {
            'requisition:WishlistItemRemoved': 'removeListItem'
        },

        initialize: function(options) {
            this.model = options.model;
            this.collection = options.collection;
            this.listenTo(this.collection, "reset", this.render);
            this.listenTo(this.collection, "add", this.addListItem);
            this.listenTo(this.collection, "remove", this.render);

            // child views
            this.childViews = [];
        },

        render: function() {
            console.log('EditListView render');
            this.destroyChildViews();
            this.childViews = [];

            // Sort wishlist such that items with the most
            // yrs experience are first in the list.
            var sortedWishlist = this.collection.sortBy(function(model) {
                return model.get_yrs_experience() * -1;
            }, this);
            _.each(sortedWishlist, this.addListItem, this);

            return this;
        },

        /**
         * Create view for the added model to the collection
         * and append to the DOM
         * @param {Object} options
         *      model: {RequisitionTechnology} (required)
         */
        addListItem: function(model) {
            console.log('editList: addListItem invoked');
            var view = new EditWishlistItemView({
                model: model
            }).render();
            this.childViews.push(view);
            this.$el.append(view.el);
        },

        removeListItem: function(e, eventBody) {
            console.log('removeListItem');
            if (eventBody.model) {
                this.collection.remove(eventBody.model);
                console.log(this.collection);
                // this will trigger a render which will
                // destroy the view
            }
        }
    });

    /**
     * Add Wishlist Item View.
     * @constructor
     * @param {Object} options
     *      model: {Requisition} (required)
     *      workingCollection: Copy of {RequisitionTechnologies} (required)
     *           We work on a copy so that we don't modify the underlying
     *           model before it is saved.
     */
    var AddWishlistItemView = view.View.extend({

        inputSelector: '#wishlist-input',

        events: {
            "click button": "onAddButton"
        },

        initialize: function(options) {
            this.model = options.model;
            this.workingCollection = options.workingCollection;

            this.lookupValue = null; // value in input field
            this.lookupData = null; // data object of input field
            this.template = _.template(wishlist_add_item_template);

            // child views
            this.childViews = [];
            this.lookupView = null;
        },

        render: function() {
            console.log('AddWishlistItem render');
            this.destroyChildViews();
            this.childViews = [];

            this.$el.html(this.template());

            // setup technology autocomplete
            this.lookupView = new lookup_views.LookupView({
                el: this.$(this.inputSelector),
                scope: 'technology',
                forceSelection: true,
                onenter: this.updateOnEnter,
                onselect: this.updateOnSelect,
                context: this
            });
            this.childViews.push(this.lookupView);

            return this;
        },

        /**
         * Listen to the 'Add' button.
         */
        onAddButton: function() {
            var value = this.$(this.inputSelector).val();
            if (value.length && value.toLowerCase() === this.lookupValue.toLowerCase()) {
                // If this check passes, it implies that the value of this.lookupValue & this.lookupData
                // are up-to-date and accurate.
                this._add(this.lookupData);
            }
        },

        /**
         * Callback to be invoked when enter is pressed on the LookupView
         * @param value  the string in the LookupView input
         * @param data  the LookupResult.matches object which is scope/category specific
         */
        updateOnEnter: function(value, data) {
            this._add(data);
        },

        /**
         * Callback to be invoked when a LookupView result is selected
         * either explicitly through the menu or implicitly
         * when focus is lost.
         * @param value the string in the LookupView input
         * @param data LookupResult.matches object which is scope/category specific
         */
        updateOnSelect: function(value, data) {
            this.lookupValue = value;
            this.lookupData = data;
        },

        /**
         * Method to add a wishlist item
         * @param data Lookup data object
         * @private
         */
        _add: function(data) {
            var technologyName = data.name;
            if (technologyName) {
                //only add if entry doesn't already exist in user's wishlist
                var technologies = this.workingCollection.collection.where({'technology_id': data.id});
                if (0 === technologies.length) {
                    var technology = new api_models.Technology({
                        id: data.id,
                        name: data.name,
                        description: data.description
                    });
                    var requisitionTechnology = new api_models.RequisitionTechnology({
                        requisition_id: this.model.id,
                        technology_id: technology.id,
                        yrs_experience: 1
                    });
                    requisitionTechnology.set_technology(technology);
                    // Manually set the flag that indicates the Technology
                    // data is loaded.  This ensures that any dependent sub-views
                    // pass their isLoaded() checks, and prevents any invalid
                    // requests to api service (for the case when the user is creating
                    // a new requisition and the model doesn't have an ID yet.
                    requisitionTechnology._technology._loaded = true;
                    console.log('AddListView just about to call add');
                    this.workingCollection.collection.add(requisitionTechnology);
                    console.log('AddListView just added model to collection');
                }
                this.$(this.inputSelector).val("");
            }
            this.$(this.inputSelector).focus();
        }

    });

    /**
     * Edit Requisition Wishlist View. The main parent view
     * to display an editable wishlist.
     * @constructor
     * @param {Object} options
     *      model: {Requisition} (required)
     *      workingCollection: This will be used to store a reference to the
     *          working RequisitionTechnology collection.
     */
    var EditRequisitionWishlistView = view.View.extend({

        addItemSelector: '#add-wishlist-item',
        listSelector: '#wishylist',

        events: {
        },

        initialize: function(options) {
            this.model = options.model;
            this.workingCollection = options.workingCollection;
            this.listenTo(this.model, 'change', this.changed);
            this.listenTo(this.model, 'loaded', this.loaded);
            this.template = _.template(wishlist_template);

            // child views
            this.childViews = [];
            this.addItemView = null;
            this.listView = null;

            if (!this.model.isLoading()) {
                this.load();
            }
        },

        loaded: function(instance) {
            //Cover case where model was already loading at time of view
            //creation, but not all necessary data was loaded. Invoking
            //load again will ensure all necessary data is loaded. If
            //all data is already loaded, this is a no-op.
            if (instance === this.model) {
                this.load();
            }
        },

        load: function() {
            // If the model doesn't have an ID, it implies that the
            // user is creating a new requisition, so there's no data
            // that needs to be loaded.
            if (this.model.id) {
                var state = this.model.isLoadedWith('requisition_technologies__technology');
                if(!state.loaded) {
                    state.fetcher({
                        success: _.bind(this.render, this)
                    });
                }
            }
        },

        changed: function() {
            console.log('EditReqWishlistParentView detected model change event');
            this.render();
        },

        render: function() {
            console.log('EditReqWishlistParentView');
            this.destroyChildViews();
            this.childViews = [];

            this.$el.html(this.template());

            // Make a copy of the RequisitionTechnology collection, so that
            // any changes made to the collection won't get applied until
            // the user saves them.
            // The reason the collection is referenced directly is
            // because the requisition model may not exist yet, and
            // calling get_requisition_technologies() would result
            // in an error in the api service on the server.
            this.workingCollection.collection = this.model._requisition_technologies.clone();

            // view to add items to wishlist
            this.addItemView = new AddWishlistItemView({
                el: this.$(this.addItemSelector),
                model: this.model,
                workingCollection: this.workingCollection
            });
            this.childViews.push(this.addItemView);
            this.addItemView.render();

            // view to manage list of items
            this.listView = new EditListView({
                el: this.$(this.listSelector),
                model: this.model,
                collection: this.workingCollection.collection
            });
            this.childViews.push(this.listView);
            this.listView.render();

            return this;
        }
    });

    /**
     * Requisition Form View.
     * @constructor
     * @param {Object} options
     *   model: {Requisition} (required)
     *   userModel: {User} (required)
     */
    var RequisitionFormView = view.View.extend({

        formSelector: '#requisition-form',

        employerReqIdSelector: '#inputEmployerReqID',
        statusSelector: '#inputStatus',
        titleSelector: '#inputTitle',
        positionTypeSelector: '#inputPositionType',
        salaryStartSelector: '#inputSalaryStart',
        salaryEndSelector: '#inputSalaryEnd',
        locationSelector: '#inputLocation',
        telecommuteSelector: '#inputTelecommute',
        relocationSelector: '#inputRelocation',
        wishlistSelector: '#wishlist-container',
        descriptionSelector: '#inputDescription',

        events: {
            'click .save': 'onSave',
            'click .cancel': 'onCancel'
        },

        initialize: function(options) {
            this.model = options.model;
            this.userModel = options.userModel;
            this.workingCollection = {collection: null};
            this.location = null;
            this.validator = null;

            // bindings
            this.listenTo(this.model, 'change', this.changed);
            this.listenTo(this.model, 'loaded', this.loaded);

            // generate form options
            this._generateRequisitionFormOptions();
            this.template = _.template(requisition_form_template);

            // child views
            this.childViews = [];
            this.lookupView = null;
            this.wishlistView = null;

            if(!this.model.isLoading()) {
                this.load();
            }
        },

        loaded: function(instance) {
            //Cover case where model was already loading at time of view
            //creation, but not all necessary data was loaded. Invoking
            //load again will ensure all necessary data is loaded. If
            //all data is already loaded, this is a no-op.
            if (instance === this.model) {
                this.load();
            }
        },

        load: function() {
            if (this.model.id) {
                var state = this.model.isLoadedWith(
                    "location",
                    "requisition_technologies__technology"
                );
                if (!state.loaded) {
                    state.fetcher({
                        success: _.bind(this.render, this)
                    });
                }
            }
        },

        /**
         * Method to generate form options.
         * Returns:
         *  Sets this.statusFormOptions
         *  and this.positionTypeFormOptions.
         * @private
         */
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

        /**
         * Method to setup the jquery validation.
         * @private
         */
        _setupValidator: function() {
            this.validator = this.$(this.formSelector).validate({
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

        /**
         * Method to disable the enter button to prevent
         * accidental submission of the form.
         * @private
         */
        _disableEnterButton: function() {
            // Only disable on input and select elements
            // so that the enter button still works in textarea elements.
            this.$('input,select').not(':submit').keypress(function(event) {
                return event.which !== 13; //13 reps enter key
            });
        },

        /**
         * Method to set the form input fields
         * with values of the model.
         * @private
         */
        _populateForm: function() {
            // set input field values
            var locationValue = null;
            var jsonModel = this.model.toJSON({withRelated: true});
            this.$(this.statusSelector).val(jsonModel.status);
            this.$(this.titleSelector).val(jsonModel.title);
            this.$(this.positionTypeSelector).val(jsonModel.position_type);
            this.$(this.salaryStartSelector).val(jsonModel.salary_start);
            this.$(this.salaryEndSelector).val(jsonModel.salary_end);
            this.$(this.descriptionSelector).val(jsonModel.description);
            this.$(this.employerReqIdSelector).val(jsonModel.employer_requisition_identifier);
            this.$(this.telecommuteSelector).prop('checked', jsonModel.telecommute);
            this.$(this.relocationSelector).prop('checked', jsonModel.relocation);
            if (jsonModel.location.city) {
                locationValue = jsonModel.location.city + ", " + jsonModel.location.state;
            } else if (jsonModel.location.state) {
                locationValue = jsonModel.location.state;
            }
            this.$(this.locationSelector).val(locationValue);

            // set internal location
            this._updateLocationData(locationValue, jsonModel.location);
        },

        /**
         * Callback to be invoked when when user selects a location
         * from the typeahead view
         * @param value  the string in the LookupView input
         * @param data  the LookupResult.matches object which is scope/category specific
         */
        _updateLocationData: function(value, data) {
            this.location = new profile_models.LocationPreference({
                locationId: data.id,
                city: data.city,
                state: data.state,
                zip: data.zip,
                country: data.country
            });
        },

        changed: function() {
            console.log('EditReqFormView() detected model change event');
            this.render();
        },

        render: function() {
            console.log('ReqForm rendering');
            this.destroyChildViews();
            this.childViews = [];

            var context = {
                model: this.model.toJSON({withRelated: true}),
                statusFormOptions: this.statusFormOptions,
                positionTypeFormOptions: this.positionTypeFormOptions
            };
            this.$el.html(this.template(context));

            // setup wishlist view
            this.wishlistView = new EditRequisitionWishlistView({
                el: this.$(this.wishlistSelector),
                model: this.model,
                workingCollection: this.workingCollection
            });
            this.childViews.push(this.wishlistView);
            this.wishlistView.render();

            // setup location autocomplete view
            this.lookupView = new lookup_views.LookupView({
                el: this.$(this.locationSelector),
                scope: 'location',
                property: 'name',
                forceSelection: true,
                onenter: this._updateLocationData,
                onselect: this._updateLocationData,
                context: this
            });
            this.childViews.push(this.lookupView);

            // setup form validator
            this._setupValidator();

            // Disable enter press to prevent accidental submit
            this._disableEnterButton();

            // fill in any provided form info
            this._populateForm();

            return this;
        },

        /**
         * Method to retrieve location data ID
         * @return Returns LocationPreference object ID or null
         * if no object is available
         */
        getLocationId: function() {
            return this.location.locationId();
        },

        /**
         * Saves the Requisition model object, and the
         * RequisitionTechnologies collection.
         */
        _saveModel: function() {

            // Validate the form before saving. If the form isn't
            // valid, the jquery validator plugin will scroll to
            // the invalid field and display an error message.
            var isFormValid = this.$(this.formSelector).valid();
            if (isFormValid) {
                var that = this;
                var reqAttributes = null;

                // Need to destroy wishlist items that the user removed.
                // This only happens if the requisition model already
                // exists and is being edited (which implies it has an ID).
                if (this.model.id) {
                    var originalCollection = this.model.get_requisition_technologies();
                    originalCollection.each(function(reqTechModel) {
                        if (reqTechModel.id) {
                            // Destroy if the updated collection doesn't contain
                            // this model from the original collection.
                            if (!this.workingCollection.collection.contains(reqTechModel)) {
                                console.log('Destroy ReqTechModel with id: %s', reqTechModel.id);
                                reqTechModel.destroy();
                            }
                        }
                    }, this);
                }
                // Copy working collection into model.
                // This will allow access to this data in the 'success' callback function,
                // which is where this data is saved to the server.
                this.model.set_requisition_technologies(this.workingCollection.collection.clone());

                // Read input field values
                reqAttributes = {
                    user_id: this.userModel.id,
                    tenant_id: this.userModel.get_tenant_id(),
                    status: this.$(this.statusSelector).val(),
                    title: this.$(this.titleSelector).val(),
                    position_type: this.$(this.positionTypeSelector).val(),
                    salary_start: this.$(this.salaryStartSelector).val(),
                    salary_end: this.$(this.salaryEndSelector).val(),
                    location_id: this.getLocationId(),
                    description: this.$(this.descriptionSelector).val(),
                    employer_requisition_identifier: this.$(this.employerReqIdSelector).val(),
                    telecommute: this.$(this.telecommuteSelector).is(":checked"),
                    relocation: this.$(this.relocationSelector).is(":checked")
                };

                // Save the model
                this.model.save(reqAttributes, {
                    wait: true,
                    success: function(model) {
                        that._saveReqTechnologyCollection(model, that);
                    },
                    error: function(model) {
                        var eventBody = {};
                        that.triggerEvent(EVENTS.SAVE_FAILED, eventBody);
                    }
                });

            }
        },

        /**
         * Callback function to save the RequisitionTechnologyCollection
         * @param {Object} options
         *   model: {Requisition} (required)
         *   context: View context (required)
         */
        _saveReqTechnologyCollection: function(model, context) {
            var requisitionModelID = model.id;
            // Need to handle the case of new requisitions which won't
            // have a req ID set on models within their RequisitionTechnologies
            // collection.
            var requisitionTechnologiesCollection = model._requisition_technologies;
            requisitionTechnologiesCollection.each(function(requisitionTechnologyModel) {
                requisitionTechnologyModel.set_requisition_id(requisitionModelID);
            });

            requisitionTechnologiesCollection.save({
                success: function(collection) {
                    var eventBody = {
                        id: requisitionModelID
                    };
                    console.log('req form: collection successfully saved. Triggering save event.');
                    context.triggerEvent(EVENTS.SAVED, eventBody);
                },
                error: function(collection) {
                    var eventBody = {
                        errorMessage: 'There was an error saving your wishlist. Please review your form and try again.'
                    };
                    context.triggerEvent(EVENTS.SAVE_FAILED, eventBody);
                }
            });
        },

        onSave: function() {
            console.log('reqForm: onSave');
            this._saveModel();
        },

        onCancel: function() {
            var eventBody = {
                id: this.model.id
            };
            this.triggerEvent(EVENTS.CANCELED, eventBody);
        }
    });

    /**
     * Create Requisition View.
     * @constructor
     * @param {Object} options
     *   model: {Requisition} (required)
     *   userModel: {User} (required)
     */
    var CreateRequisitionView = view.View.extend({

        formContainerSelector: '#req-form-container',

        initialize: function(options) {
            this.model = options.model;
            this.userModel = options.userModel;
            this.template = _.template(create_requisition_template);

            // child views
            this.childViews = [];
            this.reqFormView = null;
        },

        render: function() {
            this.$el.html(this.template());
            this.destroyChildViews();
            this.childViews = [];

            this.reqFormView = new RequisitionFormView({
                el: this.$(this.formContainerSelector),
                model: this.model,
                userModel: this.userModel
            });
            this.childViews.push(this.reqFormView);
            this.reqFormView.render();

            return this;
        }
    });

    /**
     * Edit Requisition View.
     * @constructor
     * @param {Object} options
     *   model: {Requisition} (required)
     *   userModel: {User} (required)
     */
    var EditRequisitionView = view.View.extend({

        formContainerSelector: '#req-form-container',

        initialize: function(options) {
            console.log('EditReqView created');
            console.log(options.model);
            this.model = options.model;
            this.userModel = options.userModel;
            this.template = _.template(edit_requisition_template);

            // child views
            this.childViews = [];
            this.reqFormView = null;
        },

        render: function() {
            console.log('EditReqView rendering');
            this.destroyChildViews();
            this.childViews = [];
            this.$el.html(this.template());

            this.reqFormView = new RequisitionFormView({
                el: this.$(this.formContainerSelector),
                model: this.model,
                userModel: this.userModel
            });
            this.childViews.push(this.reqFormView);
            this.reqFormView.render();

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

        wishlistContainerSelector: '.wishlist-container',

        initialize: function(options) {
            this.model = options.model;
            this.template = _.template(read_requisition_template);

            // bindings
            this.listenTo(this.model, 'change', this.changed);
            this.listenTo(this.model, 'loaded', this.loaded);

            // child views
            this.childViews = [];

            if(!this.model.isLoading()) {
                this.load();
            }
        },

        loaded: function(instance) {
            //Cover case where model was already loading at time of view
            //creation, but not all necessary data was loaded. Invoking
            //load again will ensure all necessary data is loaded. If
            //all data is already loaded, this is a no-op.
            if (instance === this.model) {
                this.load();
            }
        },

        load: function() {
            // All models should have an ID for this view
            if (this.model.id) {
                var state = this.model.isLoadedWith(
                    "location",
                    "requisition_technologies__technology"
                );
                if (!state.loaded) {
                    state.fetcher({
                        success: _.bind(this.render, this)
                    });
                }
            }
        },

        changed: function() {
            console.log('ReadReqView() detected model change event');
            this.render();
        },

        render: function() {
            console.log('ReadView render');
            this.destroyChildViews();
            this.childViews = [];

            var context = {
                fmt: this.fmt,
                model: this.model.toJSON({withRelated: true})
            };
            this.$el.html(this.template(context));

            // Sort wishlist items such that those with
            // the most yrs experience are first in the list.
            var wishlistCollection = this.model.get_requisition_technologies();
            var sortedWishlist = wishlistCollection.sortBy(function(model) {
                return model.get_yrs_experience() * -1;
            }, this);
            _.each(sortedWishlist, this.addWishlistItem, this);

            // Activate tooltips
            this.$('[rel=tooltip]').tooltip();

            return this;
        },

        addWishlistItem: function(model) {
            var view = new WishlistItemView({
                model: model
            }).render();
            this.childViews.push(view);
            this.$(this.wishlistContainerSelector).append(view.el);
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

        initialize: function(options) {
            this.action = options.action; // read, create, or edit req
            this.model = options.model;
            this.userModel = options.userModel;
            this.template =  _.template(requisition_template);

            // child views
            this.childViews = [];
            this.requisitionView = null;
        },

        render: function() {
            console.log('ParentView rendering');
            this.destroyChildViews();
            this.childViews = [];
            this.$el.html(this.template());

            // TODO does it make more sense for the mediator to hvae this logic? What purpose does this parent view serve?

            // Need to determine if user is reading,
            // editing, or creating a requisition
            if (this.action === 'create') {
                console.log('ParentView: rendering create');
                this.requisitionView = new CreateRequisitionView({
                    el: this.$(this.requisition_view_selector),
                    model: this.model,
                    userModel: this.userModel
                });
                this.childViews.push(this.requisitionView);
                this.requisitionView.render();
            }
            else if (this.action == 'edit') {
                console.log('ParentView: rendering edit');
                this.requisitionView = new EditRequisitionView({
                    el: this.$(this.requisition_view_selector),
                    model: this.model,
                    userModel: this.userModel
                });
                this.childViews.push(this.requisitionView);
                this.requisitionView.render();
            }
            else if (this.action === 'read') {
                console.log('ParentView: rendering read');
                this.requisitionView = new ReadRequisitionView({
                    el: this.$(this.requisition_view_selector),
                    model: this.model
                });
                this.childViews.push(this.requisitionView);
                this.requisitionView.render();
            }

            return this;
        }
    });

    return {
        EVENTS: EVENTS,
        RequisitionView: RequisitionView
    };
});
