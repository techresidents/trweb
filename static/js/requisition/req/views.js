define([
    'jquery',
    'underscore',
    'jquery.validate',
    'core/view',
    'api/models',
    'profile/models',
    'lookup/views',
    'text!requisition/req/templates/req.html',
    'text!requisition/req/templates/create_requisition.html',
    'text!requisition/req/templates/read_requisition.html',
    'text!requisition/req/templates/edit_requisition.html',
    'text!requisition/req/templates/requisition_form.html',
    'text!requisition/req/templates/wishlist.html',
    'text!requisition/req/templates/wishlist_item.html',
    'text!requisition/req/templates/wishlist_add_item.html'
], function(
    $,
    _,
    jquery_validate,
    view,
    api_models,
    profile_models,   // TODO reference api models instead of profile_models
    lookup_views,
    requisition_template,
    create_requisition_template,
    read_requisition_template,
    edit_requisition_template,
    requisition_form_template,
    wishlist_template,
    wishlist_item_template,
    wishlist_add_item_template) {

    /**
     * Requisition View Events
     */
    var EVENTS = {
        SAVED: 'requisition:Saved',
        CANCELED: 'requisition:Canceled',
        WISHLIST_ITEM_REMOVED: 'requisition:WishlistItemRemoved'
    };

    /**
     * Requisition Skills View.
     * @constructor
     * @param {Object} options
     *      collection: {} (optional)
     */
    var RequisitionWishlistView = view.View.extend({
        // TODO
    });

    /**
     * Edit Requisition Wishlist Item View.
     * @constructor
     * @param {Object} options
     *      model: {RequisitionTechnology} (required)
     */
    var EditWishlistItemView = view.View.extend({

        events: {
            'click .destroy': 'onDestroy'
        },

        initialize: function(options) {
            this.model = options.model;
            this.template = _.template(wishlist_item_template);
            this.listenTo(this.model, 'change', this.render);
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
            var state = this.model.isLoadedWith('technology'); // TODO Is it weird to require this to be loaded with something, when we can't actually go and get it since a req ID may not exist?
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
            //this.$el.remove();
        },

        changed: function() {
            console.log('EditWishlistItemView detected model change event');
            this.render();
        },

        render: function() {
            console.log('WishlistItemView render');
            var context = {
                model: this.model.toJSON({withRelated: true})
            };
            this.$el.html(this.template(context));
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

        // TODO Does it make sense to not check if the colleciton is loaded
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

            // Remove child views
            _.each(this.childViews, function(view) {
                view.destroy();
            });
            this.childViews = [];

            // Sort wishlist items such that those with the most yrs experience
            // are first in the list.
            var sortedWishlist = this.collection.sortBy(function(model) {
                return model.get_yrs_experience() * -1;
            }, this);

            // Add skills to DOM in order
            _.each(sortedWishlist, this.addListItem, this);

            // Activate tooltips
            this.$('[rel=tooltip]').tooltip();

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
            _.each(this.childViews, function(view) {
                if(_.isFunction(view.destroy)) {
                    view.destroy();
                }
            });
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
            if (value.toLowerCase() === this.lookupValue.toLowerCase()) {
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
                    requisitionTechnology._technology._loaded = true; // TODO temporary - this ensures that the ListItemView passes this check
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
            _.each(this.childViews, function(view) {
                view.destroy();
            });
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

        _setupValidator: function() {
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

        _populateForm: function() {

            // TODO can probably move these into the HTML later.

            var jsonModel = this.model.toJSON({withRelated: true});
            this._updateLocationData(null, jsonModel.location);

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
                this.$(this.locationSelector).val(jsonModel.location.city + ", " + jsonModel.location.state);
            } else if (jsonModel.location.state) {
                this.$(this.locationSelector).val(jsonModel.location.state);
            }

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
            // TODO consider which data needs to be reset if the model has changed.
        },

        render: function() {
            console.log('ReqForm rendering');
            console.log(this);
            _.each(this.childViews, function(view) {
                if(_.isFunction(view.destroy)) {
                    view.destroy();
                }
            });
            this.childViews = [];

            var context = {
                model: this.model.toJSON({withRelated: true}),
                statusFormOptions: this.statusFormOptions,
                positionTypeFormOptions: this.positionTypeFormOptions
            };
            this.$el.html(this.template(context));

            // setup form validator
            this._setupValidator();

            // setup wishlist
            this.wishlistView = new EditRequisitionWishlistView({
                el: this.$(this.wishlistSelector),
                model: this.model,
                workingCollection: this.workingCollection
            });
            this.childViews.push(this.wishlistView);
            this.wishlistView.render();

            // setup location autocomplete
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

            // disable 'enter' button push to prevent accidental
            // submission of the form. Only disable on input elements
            // so that the enter button still works in the textarea
            // and select elements.
            this.$('input').not(':submit').keypress(function(event) {
                return event.which !== 13;
            });

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

        onSave: function() {
            console.log('reqForm: onSave');
            var that = this;
            this.model._requisition_technologies = this.workingCollection.collection.clone();
            console.log(this.workingCollection.collection.length);
            console.log(this.workingCollection.collection);
            this.model.save({
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
            }, {
                wait: true,
                success: function(model) {
                    var requisitionModelID = model.id;
                    var requisitionTechnologiesCollection = model._requisition_technologies;
                    console.log('req form: Returned working collection');
                    console.log(requisitionTechnologiesCollection);

                    // Need to handle new requisitions which won't have a req ID set on models
                    // within their RequisitionTechnologies collection.
                    requisitionTechnologiesCollection.each(function(requisitionTechnologyModel) {
                        requisitionTechnologyModel.set_requisition_id(requisitionModelID);
                    });

                    requisitionTechnologiesCollection.save({
                        success: function(collection) {
                            var eventBody = {
                                id: requisitionModelID
                            };
                            console.log('req form: collection successfully saved. Triggering save event.');
                            that.triggerEvent(EVENTS.SAVED, eventBody);
                        },
                        error: function(collection) {
                            // TODO
                            console.log('error saving requisition_technologies collection');
                            console.log(collection);
                        }
                    });
                },
                error: function(model) {
                    // TODO
                    console.log('error saving requisition model');
                    console.log(model);
                }
            });
        },

        onCancel: function() {
            // TODO
            // update collections silently until save. If saved, use the new collection.
            // Else: restore original collection data. use silent:true flag
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
            _.each(this.childViews, function(view) {
                view.destroy();
            });
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
            _.each(this.childViews, function(view) {
                view.destroy();
            });
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

        initialize: function(options) {
            this.model = options.model;
            this.template = _.template(read_requisition_template);

            // bindings
            this.listenTo(this.model, 'change', this.changed);
            this.listenTo(this.model, 'loaded', this.loaded);

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
            console.log(this);
            _.each(this.childViews, function(view) {
                view.destroy();
            });
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
