define([
    'jquery',
    'underscore',
    'jquery.validate',
    'core/array',
    'core/view',
    'api/loader',
    'api/models',
    'lookup/views',
    'text!requisition/req/templates/req.html',
    'text!requisition/req/templates/requisition_create.html',
    'text!requisition/req/templates/requisition_read.html',
    'text!requisition/req/templates/requisition_edit.html',
    'text!requisition/req/templates/requisition_form.html',
    'text!requisition/req/templates/wishlist_edit.html',
    'text!requisition/req/templates/wishlist_item_edit.html',
    'text!requisition/req/templates/wishlist_item.html',
    'text!requisition/req/templates/wishlist_add_item.html'
], function(
    $,
    _,
    jquery_validate,
    array,
    view,
    api_loader,
    api_models,
    lookup_views,
    requisition_template,
    create_requisition_template,
    read_requisition_template,
    edit_requisition_template,
    requisition_form_template,
    edit_wishlist_template,
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

            this.listenTo(this.model, 'change', this.onChange);
            this.listenTo(this.model.get_technology(), 'change', this.onChange);

            this.loader = new api_loader.ApiLoader([
                { instance: this.model, withRelated: ['technology'] }
            ]);
            this.loader.load();
        },

        destroy: function() {
            // Need to hide any tooltips since this view could be removed
            // from the DOM before a mouseleave() event fires
            this.$("[rel=tooltip]").tooltip('hide');
            view.View.prototype.destroy.apply(this, arguments);
        },

        render: function() {
            var context = {
                model: this.model.toJSON({
                    withRelated: ['technology']
                })
            };
            this.$el.html(this.template(context));
            this.$('[rel=tooltip]').tooltip(); // Activate tooltips
            return this;
        },

        onChange: function() {
            this.render();
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

            this.listenTo(this.model, 'change', this.onChange);
            this.listenTo(this.model.get_technology(), 'change', this.onChange);

            this.loader = new api_loader.ApiLoader([
                { instance: this.model, withRelated: ['technology'] }
            ]);
            this.loader.load();
        },

        destroy: function() {
            // Need to hide any tooltips since this view could be removed
            // from the DOM before a mouseleave() event fires
            this.$("[rel=tooltip]").tooltip('hide');
            view.View.prototype.destroy.apply(this, arguments);
        },

        render: function() {
            var context = {
                model: this.model.toJSON({
                    withRelated: ['technology']
                })
            };
            this.$el.html(this.template(context));
            this.$('[rel=tooltip]').tooltip(); // Activate tooltips
            return this;
        },

        onChange: function() {
            this.render();
        },

        /**
         * Listen on user deleting this wishlist item
         */
        onDestroy: function() {
            var eventBody = {
                model: this.model
            };
            this.triggerEvent(EVENTS.WISHLIST_ITEM_REMOVED, eventBody);
        },

        /**
         * Listen on up arrow click
         */
        onUpArrow: function() {
            this.incrementYrsExperience();
        },

        /**
         * Listen on down arrow click
         */
        onDownArrow: function() {
            this.decrementYrsExperience();
        },

        /**
         * Increment the yrs experience by one
         */
        incrementYrsExperience: function() {
            var yrs = this.model.get_yrs_experience();
            this.model.set_yrs_experience(yrs + 1);
        },

        /**
         * Decrement the yrs experience by one
         */
        decrementYrsExperience: function() {
            var yrs = this.model.get_yrs_experience();
            // minimum of 1 yr experience
            if (yrs > 1) {
                this.model.set_yrs_experience(yrs - 1);
            }
        }
    });

    /**
     * Edit List View.
     * @constructor
     * @param {Object} options
     *      collection: {RequisitionTechnologyCollection} which will be modified (required)
     */
    var EditListView = view.View.extend({

        events: {
            'requisition:WishlistItemRemoved': 'onRemoveListItem'
        },

        initialize: function(options) {
            this.collection = options.collection;
            this.listenTo(this.collection, 'add', this.onAdd);
            this.listenTo(this.collection, 'remove', this.onRemove);
            this.listenTo(this.collection, 'reset', this.onReset);

            // child views
            this.childViews = [];
            this.initChildViews();
        },

        initChildViews: function() {
            this.destroyChildViews();
            this.childViews = [];

            // Only sort initial list of wishlist items.
            // Sort items such that those with the most
            // yrs experience are first in the list.
            var sortedWishlist = this.collection.sortBy(function(model) {
                return model.get_yrs_experience() * -1;
            }, this);

            // Create views for each item
            _.each(sortedWishlist, this.createEditableWishlistItemView, this);
        },

        render: function() {
            _.each(this.childViews, function(view) {
                this.append(view);
            }, this);
            return this;
        },

        /**
         * Listen on collection add event
         */
        onAdd: function(model) {
            // Create a view for the added model and append to DOM
            var view = this.createEditableWishlistItemView(model);
            this.append(view);
        },

        /**
         * Listen on collection remove event
         */
        onRemove: function(model) {
            // TODO We should be able to just destroy the view
            // associated with the model that was removed from the collection.
            this.initChildViews();
            this.render();
        },

        /**
         * Listen on collection reset event
         */
        onReset: function() {
            this.initChildViews();
            this.render();
        },

        /**
         * Listen on DOM remove event
         */
        onRemoveListItem: function(e, eventBody) {
            if (eventBody.model) {
                this.removeListItem(eventBody.model);
            }
        },

        removeListItem: function(model) {
            if (model) {
                this.collection.remove(model);
                // this will trigger a render which will
                // destroy the view
            }
        },

        createEditableWishlistItemView: function(model) {
            var view = new EditWishlistItemView({
                model: model
            });
            this.childViews.push(view);
            return view;
        }
    });

    /**
     * Add Wishlist Item View.
     * @constructor
     * @param {Object} options
     *      model: {Requisition} (required)
     *      collection: {RequisitionTechnology} collection which will be modified (required)
     */
    var AddWishlistItemView = view.View.extend({

        inputSelector: '#wishlist-input',

        events: {
            'click button': 'onAddButton'
        },

        initialize: function(options) {
            this.model = options.model;
            this.collection = options.collection;
            this.originalCollection = this.collection.clone();

            this.lookupValue = null; // value in input field
            this.lookupData = null; // data object of input field
            this.template = _.template(wishlist_add_item_template);

            // child views
            this.lookupView = null;
        },

        childViews: function() {
            return [this.lookupView];
        },

        render: function() {
            this.destroyChildViews();
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
                var technologies = this.collection.where({'technology_id': data.id});
                var originalTechnologies = this.originalCollection.where({'technology_id': data.id});
                if (!technologies.length && !originalTechnologies.length) {
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
                    this.collection.add(requisitionTechnology);
                } else if(!technologies.length && originalTechnologies.length) {
                        this.collection.add(originalTechnologies[0]);
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
     *      collection: RequisitionTechnology collection which will be modified.
     */
    var EditRequisitionWishlistView = view.View.extend({

        addItemSelector: '.add-wishlist-item-container',
        listSelector: '.wishlist-container',

        initialize: function(options) {
            this.model = options.model;
            this.collection = options.collection;
            this.template = _.template(edit_wishlist_template);

            this.loader = new api_loader.ApiLoader([
                { instance: this.model, withRelated: ['requisition_technologies__technology'] }
            ]);

            // Only need to load if Requisition model already exists.
            // If the model exists, then it'll have an ID.
            if (this.model.id) {
                this.loader.load();
            }

            // child views
            this.addItemView = null;
            this.listView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [
                this.addItemView,
                this.listView
            ];
        },

        initChildViews: function() {
            this.destroyChildViews();

            this.addItemView = new AddWishlistItemView({
                model: this.model,
                collection: this.collection
            });

            this.listView = new EditListView({
                collection: this.collection
            });
        },

        render: function() {
            this.$el.html(this.template());
            this.append(this.addItemView, this.addItemSelector);
            this.assign(this.listView, this.listSelector);
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

        /**
         * Method to setup the jquery validation.
         * @private
         */
        _setupValidator: function() {
            this.validator = this.$(this.formSelector).validate({
                // specify error class to be consistent with bootstrap
                errorClass: 'error help-inline',
                errorElement: 'span',
                highlight: function (element, errorClass, validClass) {
                    $(element).parents("div.control-group").addClass("error").removeClass(validClass);

                },
                unhighlight: function (element, errorClass, validClass) {
                    $(element).parents(".error").removeClass(errorClass).addClass(validClass);
                },
                rules: {
                    title: { required: true, minlength: 1, maxlength: 100 },
                    salary_start: { required: true, number: true, maxlength: 10 },
                    salary_end: { required: true, number: true, maxlength: 10 },
                    location: { required: true, minlength: 2, maxlength: 100 },
                    description: { required: true, minlength: 1, maxlength: 1024 }
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
            var jsonModel = this.model.toJSON({
                withRelated: this.modelWithRelated
            });
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
            this.location = new api_models.Location({
                id: data.id,
                city: data.city,
                state: data.state,
                zip: data.zip,
                country: data.country
            });
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

                // Read input field values
                reqAttributes = {
                    user_id: this.userModel.id,
                    tenant_id: this.userModel.get_tenant_id(),
                    status: this.$(this.statusSelector).val(),
                    title: this.$(this.titleSelector).val(),
                    position_type: this.$(this.positionTypeSelector).val(),
                    salary_start: this.$(this.salaryStartSelector).val().replace(/\,/g, ''), // commas are valid in the form, but should be removed before sending to server
                    salary_end: this.$(this.salaryEndSelector).val().replace(/\,/g, ''), // remove commas
                    location_id: this.getLocationId(),
                    description: this.$(this.descriptionSelector).val(),
                    employer_requisition_identifier: this.$(this.employerReqIdSelector).val(),
                    telecommute: this.$(this.telecommuteSelector).is(":checked"),
                    relocation: this.$(this.relocationSelector).is(":checked")
                };

                // Save the model
                // TODO call validate explicitly to display any errors
                this.model.save(reqAttributes, {
                    wait: true,
                    success: function(model) {
                        that._saveReqTechnologyCollection();
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
         */
        _saveReqTechnologyCollection: function() {
            var that = this;

            //handle the create case where requisition_id is not yet set.
            this.workingCollection.each(function(model) {
                model.set_requisition_id(this.model.id);
            }, this);

            this.workingCollection.save({
                success: function(collection) {
                    var eventBody = {
                        id: that.model.id
                    };
                    that.triggerEvent(EVENTS.SAVED, eventBody);
                },
                error: function(collection) {
                    var eventBody = {
                        errorMessage: 'There was an error saving your wishlist. Please review your form and try again.'
                    };
                    that.triggerEvent(EVENTS.SAVE_FAILED, eventBody);
                }
            });
        },

        initialize: function(options) {
            this.model = options.model;
            this.userModel = options.userModel;
            this.workingCollection = this.model.get_requisition_technologies().clone();
            this.modelWithRelated = ['location', 'requisition_technologies__technology'];
            this.location = null;
            this.validator = null;

            // bindings
            this.listenTo(this.model, 'change', this.onChange);
            this.listenTo(this.model.get_location(), 'change', this.onChange);

            this.template = _.template(requisition_form_template);
            
            // Requisition status options
            this.statusFormOptions = [
                { option: 'Open', value: 'OPEN' },
                { option: 'Closed', value: 'CLOSED' }
            ];

            // Requisition position type options
            this.positionTypeFormOptions = [
                { option: 'Junior Developer', value: 'Junior Developer' },
                { option: 'Senior Developer', value: 'Senior Developer' },
                { option: 'Team Lead', value: 'Team Lead' }
            ];
            
            this.loader = new api_loader.ApiLoader([
                {
                    instance: this.model,
                    withRelated: this.modelWithRelated
                }
            ]);

            // Only need to load if model already has an ID.
            // This is needed when editing an existing Requisition.
            if (this.model.id) {
                this.loader.load({
                    success: _.bind(function() {
                        this.workingCollection = this.model.get_requisition_technologies().clone();
                        this.initChildViews();
                        this.render();
                    }, this)
                });
            }

            // child views
            this.lookupView = null;
            this.wishlistView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [
                this.lookupView,
                this.wishlistView
            ];
        },

        initChildViews: function() {
            this.destroyChildViews();
            this.wishlistView = new EditRequisitionWishlistView({
                model: this.model,
                collection: this.workingCollection
            });
        },

        render: function() {
            var context = {
                model: this.model.toJSON({
                    withRelated: this.modelWithRelated
                }),
                statusFormOptions: this.statusFormOptions,
                positionTypeFormOptions: this.positionTypeFormOptions
            };
            this.$el.html(this.template(context));

            // setup wishlist view
            this.append(this.wishlistView, this.wishlistSelector);

            // The lookupView is created within render() because it's
            // required to pass 'el' to the c'tor. Consequently, we need
            // to destroy this view if it already exists.
            if (this.lookupView) {
                // Destroy Backbone view
                this.lookupView.remove();
                this.lookupView.undelegateEvents();
            }
            this.lookupView = new lookup_views.LookupView({
                el: this.$(this.locationSelector),
                scope: 'location',
                property: 'name',
                forceSelection: true,
                onenter: this._updateLocationData,
                onselect: this._updateLocationData,
                context: this
            });

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
            return this.location.id;
        },

        onChange: function() {
            this.render();
        },

        onSave: function() {
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
            this.reqFormView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [this.reqFormView];
        },

        initChildViews: function() {
            this.destroyChildViews();
            this.reqFormView = new RequisitionFormView({
                model: this.model,
                userModel: this.userModel
            });
        },

        render: function() {
            this.$el.html(this.template());
            this.append(this.reqFormView, this.formContainerSelector);
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
            this.model = options.model;
            this.userModel = options.userModel;
            this.template = _.template(edit_requisition_template);

            // child views
            this.reqFormView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [this.reqFormView];
        },

        initChildViews: function() {
            this.destroyChildViews();
            this.reqFormView = new RequisitionFormView({
                model: this.model,
                userModel: this.userModel
            });
        },

        render: function() {
            this.$el.html(this.template());
            this.append(this.reqFormView, this.formContainerSelector);
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
            this.modelWithRelated = ['location', 'requisition_technologies__technology'];
            this.wishlistCollection = this.model.get_requisition_technologies();
            this.template = _.template(read_requisition_template);

            // bindings
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.wishlistCollection, 'reset', this.onResetWishlist);
            this.listenTo(this.wishlistCollection, 'add', this.onAddWishlistItem);

            // load data
            this.loader = new api_loader.ApiLoader([
                {instance: this.model, withRelated: this.modelWithRelated}
            ]);
            this.loader.load();

            // child views
            this.childViews = [];
            this.initChildViews();
        },

        /**
         * Override
         */
        destroy: function() {
            // Need to hide any tooltips since this view could be removed
            // from the DOM before a mouseleave() event fires
            this.$("[rel=tooltip]").tooltip('hide');
            view.View.prototype.destroy.apply(this, arguments);
        },

        initChildViews: function() {
            this.destroyChildViews();
            this.childViews = [];
            this.wishlistCollection.each(this.createWishlistItemView, this);
        },

        createWishlistItemView: function(model) {
            var view = new WishlistItemView({
                model: model
            });
            var compare = function(view1, view2) {
                return array.defaultCompare(
                    -view1.model.get_yrs_experience(),
                    -view2.model.get_yrs_experience());
            };
            array.binaryInsert(this.childViews, view, compare);
            return view;
        },

        render: function() {
            var context = {
                fmt: this.fmt,
                model: this.model.toJSON({
                    withRelated: this.modelWithRelated
                })
            };
            this.$el.html(this.template(context));

            _.each(this.childViews, function(view) {
                this.append(view, this.wishlistContainerSelector);
            }, this);

            // Activate tooltips
            this.$('[rel=tooltip]').tooltip();

            return this;
        },

        onResetWishlist: function() {
            this.initChildViews();
            this.render();
        },

        onAddWishlistItem: function(model) {
            var view = this.createWishlistItemView(model);
            // Have to call render() so that the wishlist item
            // views are ordered correctly.
            this.render();
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
            this.requisitionView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [this.requisitionView];
        },

        initChildViews: function() {
            this.destroyChildViews();
            // Need to determine if user is reading,
            // editing, or creating a requisition
            if (this.action === 'create') {
                this.requisitionView = new CreateRequisitionView({
                    model: this.model,
                    userModel: this.userModel
                });
            }
            else if (this.action === 'edit') {
                this.requisitionView = new EditRequisitionView({
                    model: this.model,
                    userModel: this.userModel
                });
            }
            else if (this.action === 'read') {
                this.requisitionView = new ReadRequisitionView({
                    model: this.model
                });
            }
        },

        render: function() {
            this.$el.html(this.template());
            if (this.requisitionView) {
                this.append(this.requisitionView, this.requisition_view_selector);
            }
            return this;
        }
    });

    return {
        EVENTS: EVENTS,
        RequisitionView: RequisitionView
    };
});