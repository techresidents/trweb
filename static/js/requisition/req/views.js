define([
    'jquery',
    'underscore',
    'jquery.validate',
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
            this.listenTo(this.model, 'change', this.changed);
            this.loader = new api_loader.ApiLoader([
                { instance: this.model, withRelated: ['technology'] }
            ]);

            this.loader.load({
                success: _.bind(this.render, this)
            });
        },

        destroy: function() {
            // Need to hide any tooltips since this view could be removed
            // from the DOM before a mouseleave() event fires
            this.$("[rel=tooltip]").tooltip('hide');
            view.View.prototype.destroy.apply(this, arguments);
        },

        changed: function() {
            this.render();
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
            this.loader = new api_loader.ApiLoader([
                { instance: this.model, withRelated: ['technology'] }
            ]);

            this.loader.load({
                success: _.bind(this.render, this)
            });
        },

        destroy: function() {
            // Need to hide any tooltips since this view could be removed
            // from the DOM before a mouseleave() event fires
            this.$("[rel=tooltip]").tooltip('hide');
            view.View.prototype.destroy.apply(this, arguments);
        },

        onDestroy: function() {
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
            this.render();
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
        }
    });

    /**
     * Edit List View.
     * @constructor
     * @param {Object} options
     *      model: {Requisition} (required)
     *      collection: {RequisitionTechnologyCollection} which will be modified (required)
     */
    var EditListView = view.View.extend({

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
            var view = new EditWishlistItemView({
                model: model
            }).render();
            this.childViews.push(view);
            this.$el.append(view.el);
        },

        removeListItem: function(e, eventBody) {
            if (eventBody.model) {
                this.collection.remove(eventBody.model);
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
     *      collection: {RequisitionTechnology} collection which will be modified (required)
     */
    var AddWishlistItemView = view.View.extend({

        inputSelector: '#wishlist-input',

        events: {
            "click button": "onAddButton"
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
            this.listenTo(this.model, 'change', this.changed);
            this.template = _.template(edit_wishlist_template);

            // child views
            this.addItemView = null;
            this.listView = null;

            this.loader = new api_loader.ApiLoader([
                { instance: this.model, withRelated: ['requisition_technologies__technology'] }
            ]);

            if (this.model.id) {
                this.loader.load({
                    success: _.bind(this.render, this)
                });
            }

        },

        childViews: function() {
            return [this.addItemView, this.listView];
        },

        changed: function() {
            this.render();
        },

        render: function() {
            this.destroyChildViews();
            this.$el.html(this.template());

            // view to add items to wishlist
            this.addItemView = new AddWishlistItemView({
                model: this.model,
                collection: this.collection
            }).render();
            this.$(this.addItemSelector).append(this.addItemView.el);

            // view to manage list of items
            this.listView = new EditListView({
                el: this.$(this.listSelector), // TODO
                model: this.model,
                collection: this.collection
            }).render();

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
            this.workingCollection = this.model.get_requisition_technologies().clone();
            this.location = null;
            this.validator = null;

            // bindings
            this.listenTo(this.model, 'change', this.changed);

            this.template = _.template(requisition_form_template);

            // child views
            this.lookupView = null;
            this.wishlistView = null;
            
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
                    withRelated: ['location', 'requisition_technologies__technology']
                }
            ]);

            if (this.model.id) {
                this.loader.load({
                    success: _.bind(function() {
                        this.workingCollection = this.model.get_requisition_technologies().clone();
                        this.render();
                    }, this)
                });
            }
        },

        childViews: function() {
            return [this.lookupView, this.wishlistView];
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
                withRelated: ['location', 'requisition_technologies__technology']
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

        changed: function() {
            this.render();
        },

        render: function() {
            this.destroyChildViews();

            var context = {
                model: this.model.toJSON({
                    withRelated: ['location', 'requisition_technologies__technology']
                }),
                statusFormOptions: this.statusFormOptions,
                positionTypeFormOptions: this.positionTypeFormOptions
            };
            this.$el.html(this.template(context));

            // setup wishlist view
            this.wishlistView = new EditRequisitionWishlistView({
                model: this.model,
                collection: this.workingCollection
            }).render();
            this.$(this.wishlistSelector).append(this.wishlistView.el);

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
        },

        childViews: function() {
            return [this.reqFormView];
        },

        render: function() {
            this.destroyChildViews();
            this.$el.html(this.template());

            this.reqFormView = new RequisitionFormView({
                model: this.model,
                userModel: this.userModel
            }).render();
            this.$(this.formContainerSelector).append(this.reqFormView.el);

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
        },

        childViews: function() {
            return [this.reqFormView];
        },

        render: function() {
            this.destroyChildViews();
            this.$el.html(this.template());

            this.reqFormView = new RequisitionFormView({
                model: this.model,
                userModel: this.userModel
            }).render();
            this.$(this.formContainerSelector).append(this.reqFormView.el);

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
            this.listenTo(this.model, 'change', this.render);

            // child views
            this.childViews = [];

            this.loader = new api_loader.ApiLoader([
                {
                    instance: this.model,
                    withRelated: ['location', 'requisition_technologies__technology']
                }
            ]);

            this.loader.load({
                success: _.bind(this.render, this)
            });
        },

        destroy: function() {
            // Need to hide any tooltips since this view could be removed
            // from the DOM before a mouseleave() event fires
            this.$("[rel=tooltip]").tooltip('hide');
            view.View.prototype.destroy.apply(this, arguments);
        },

        render: function() {
            this.destroyChildViews();
            this.childViews = [];

            var context = {
                fmt: this.fmt,
                model: this.model.toJSON({
                    withRelated: ['location', 'requisition_technologies__technology']
                })
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
            this.requisitionView = null;
        },

        childViews: function() {
            return [this.requisitionView];
        },

        render: function() {
            this.destroyChildViews();
            this.$el.html(this.template());

            // TODO does it make more sense for the mediator to hvae this logic? What purpose does this parent view serve?

            // Need to determine if user is reading,
            // editing, or creating a requisition
            if (this.action === 'create') {
                this.requisitionView = new CreateRequisitionView({
                    model: this.model,
                    userModel: this.userModel
                }).render();
            }
            else if (this.action === 'edit') {
                this.requisitionView = new EditRequisitionView({
                    model: this.model,
                    userModel: this.userModel
                }).render();
            }
            else if (this.action === 'read') {
                this.requisitionView = new ReadRequisitionView({
                    model: this.model
                }).render();
            }

            if (this.requisitionView) {
                this.$(this.requisition_view_selector).append(this.requisitionView.el);
            }

            return this;
        }
    });

    return {
        EVENTS: EVENTS,
        RequisitionView: RequisitionView
    };
});