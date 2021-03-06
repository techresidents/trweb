define([
    'jquery',
    'backbone',
    'underscore',
    'core',
    'api',
    'ui',
    'events',
    '../application/handlers',
    'text!./templates/interview_offer_brief.html',
    'text!./templates/interview_offer_details.html'
], function(
    $,
    Backbone,
    _,
    core,
    api,
    ui,
    events,
    application_handlers,
    interview_offer_brief_template,
    interview_offer_details_template) {

    var InterviewOfferBriefView = core.view.View.extend(
        /** @lends module:widget/offer/views~InterviewOfferBriefView.prototype */
        {
            /**
             * Interview offer brief view.
             * @constructs
             * @augments module:core/view~View
             * @param {Object} options
             * @param {InterviewOffer} options.model Interview offer model
             */
            initialize: function(options) {
                this.template = _.template(interview_offer_brief_template);
                this.model = options.model;
                this.modelWithRelated = ['employee', 'application__requisition'];
                this.loader = new api.loader.ApiLoader([
                    { instance: this.model, withRelated: this.modelWithRelated }
                ]);

                //bind events
                this.listenTo(this.loader, 'loaded', this.render);

                //load data
                this.loader.load();
            },

            events: {
            },

            classes: function() {
                return ['w-interview-offer-brief'];
            },

            context: function() {
                return {
                    fmt: core.format,
                    model: this.model.toJSON({
                        withRelated: this.modelWithRelated
                    })
                };
            },

            render: function() {
                if(this.loader.isLoaded()) {
                    var context = this.context();
                    this.$el.html(this.template(context));
                    this.$el.attr('class', this.classes().join(' '));
                }
                return this;
            }
        }
    );

    InterviewOfferBriefView.Factory = core.factory.buildFactory(InterviewOfferBriefView);

    
    var InterviewOfferBriefsView = ui.collection.views.CollectionView.extend(
        /** @lends module:widget/offer/views~InterviewOfferBriefsView.prototype */
        {
            /**
             * Interview offer briefs view
             * @constructs
             * @augments module:ui/collection/view~CollectionView
             * @param {Object} options
             * @param {InterviewOfferCollection} options.collection
             *   interview offer collection
             */
            initialize: function(options) {
                options.viewFactory = new InterviewOfferBriefView.Factory();
                InterviewOfferBriefsView.__super__.initialize.call(this, options);
            },

            classes: function() {
                var result = InterviewOfferBriefsView.__super__.classes.call(this);
                result.push('w-interview-offers-briefs');
                return result;
            }
        }
    );

    var MakeInterviewOfferValidator = ui.form.validators.FormValidator.extend(
    /** @lends module:widget/offer/views~MakeInterviewOfferValidator.prototype */ {

        /**
         * MakeInterviewOfferValidator constructor
         * @constructor
         * @augments module:ui/form/validators~FormValidator.prototype
         * @param {object} options Options object
         * @param {MakeInterviewOfferModal} options.form Offer form
         */
        initialize: function(options) {
            this.form = options.form;
        },

        /**
         * Validate the form
         * @param {FormState} state Current form state
         * @returns {boolean} True if form is valid or False if
         *   form is invalid but no error message should be displayed.
         * @throws {Error} If form is invalid
         *   an exception will be raised containing
         *   an appropriate error message.
         */
        validate: function(state, options) {
            var valid = MakeInterviewOfferValidator.__super__.validate.call(this, state, options);
            var requisition = this.form.formModel.get('requisition');
            if(valid && requisition) {
                this.form.offers.each(function(offer) {
                    if(offer.get_application().get_requisition_id() === requisition.id &&
                       offer.get_status() === 'PENDING') {
                        throw new Error('There is already an offer pending.');
                    }
                });
            }

            return valid;
        }
        
    });

    var MakeInterviewOfferModal = ui.modal.views.ModalFormView.extend(
        /** @lends module:widget/offer/views~MakeInterviewOfferModal.prototype */
        {

            /**
             * Make Interview Offer Modal
             * @constructs
             * @augments module:ui/modal/view~ModalFormView
             * @param {Object} options
             * @param {User} options.model
             *   User model for candidate to track
             * @param {Application} [options.application]
             *   Application model to make interview offer for
             */
            initialize: function(options) {
                options = _.extend({
                    title: 'Make Interview Offer'
                }, options);

                this.model = options.model;
                this.application = options.application;
                this.currentUser = new api.models.User({id: 'CURRENT'});
                this.currentTenant = this.currentUser.get_tenant();

                this.applications = this.currentTenant.get_applications()
                    .filterBy({ user_id: this.model.id });

                this.offers = this.currentTenant.get_interview_offers()
                    .filterBy({ candidate_id: this.model.id })
                    .withRelated(['application']);

                this.loader = new api.loader.ApiLoader([
                    { instance: this.applications },
                    { instance: this.offers }
                ]);

                this.initialized = false;

                var expirationDate = new core.date.Date();
                expirationDate.add(new core.date.Interval(0, 0, 7));

                this.formModel = new Backbone.Model({
                    type: null,
                    candidate: this.model.id,
                    expiration: expirationDate,
                    requisition: this.application ? this.application.get_requisition() : null
                });

                options.fields = [
                    this.typeField(this.formModel),
                    this.requisitionField(this.formModel),
                    this.candidateField(this.formModel),
                    this.expirationField(this.formModel)
                ];

                options.actions = [
                    new ui.form.actions.ButtonAction({
                        label: 'Save',
                        primary: true,
                        handler: _.bind(this.onSave, this)
                    }),

                    new ui.form.actions.ButtonAction({
                        label: 'Cancel',
                        primary: false,
                        handler: _.bind(this.onCancel, this)
                    })
                ];

                if(!options.validator) {
                    options.validator = new MakeInterviewOfferValidator({
                        form: this
                    });
                }

                //bind events
                this.listenTo(this.loader, 'loaded', this.render);

                //load data
                this.loader.load();

                MakeInterviewOfferModal.__super__.initialize.call(this, options);

                this.initialized = true;
            },

            render: function() {
                if(this.loader.isLoaded() && this.initialized) {
                    MakeInterviewOfferModal.__super__.render.call(this);
                }
                return this;
            },

            typeField: function(model) {
                return new ui.form.fields.DropdownField({
                    name: 'type',
                    model: model,
                    label: 'Offer',
                    choices: [
                        { label: '', value: null },
                        { label: 'Phone Interview', value: 'PHONE' },
                        { label: 'In-house Interview', value: 'IN_HOUSE' }
                    ]
                });
            },

            candidateField: function(model) {
                return new ui.form.fields.InputField({
                    name: 'candidate',
                    model: model,
                    label: 'Developer',
                    enabled: false
                });
            },

            expirationField: function(model) {
                return new ui.form.fields.DateField({
                    name: 'expiration',
                    model: model,
                    label: 'Expiration',
                    enabled: false
                });
            },

            requisitionField: function(model) {
                var that = this;
                //build query factory
                var queryFactory = function(options) {
                    var collection = that.currentUser.get_tenant().get_requisitions();
                    var query = collection.filterBy({
                        status: 'OPEN'
                    }).slice(0, 40).query();
                    return query;
                };
                queryFactory = new core.factory.FunctionFactory(queryFactory);

                //map
                var map = function(model) {
                    var result = model;
                    that.offers.each(function(offer) {
                        if(offer.get_application().get_requisition_id() === model.id &&
                           offer.get_status() === 'PENDING') {
                            result = null;
                        }
                    });
                    that.applications.each(function(application) {
                        if(application.get_requisition_id() === model.id) {
                            var Handler = application_handlers.ApplicationHandler;
                            var handler = new Handler({
                                model: application,
                                view: that
                            });
                            if(!handler.isValidAction(Handler.MAKE_INTERVIEW_OFFER)) {
                                result = null;
                            }
                        }
                    });
                    return result;
                };

                //convert string or model to string
                var stringify = function(model) {
                    return model.get_title();
                };

                //match which will return location string to ac view
                var matcher = new ui.ac.matcher.QueryMatcher({
                    queryFactory: queryFactory,
                    map: map,
                    stringify: stringify
                });

                return new ui.form.fields.AutoCompleteField({
                    name: 'requisition',
                    model: model,
                    label: 'Requisition',
                    matcher: matcher,
                    placeholder: 'Requisition Title',
                    maxResults: 10,
                    enabled: this.application === undefined,
                    viewOptions: { defaultSearch: '' }
                });
            },

            onSave: function(options) {
                var requisition = this.formModel.get('requisition');
                var application = this.application || _.first(this.applications.where({
                    requisition_id: requisition.id
                }));
                var offer = new api.models.InterviewOffer({
                    type: this.formModel.get('type'),
                    expires: this.formModel.get('expiration')
                });

                if(!application) {
                    application = new api.models.Application({
                        user_id: this.model.id,
                        requisition_id: requisition.id
                    });
                    this.triggerEvent(events.CREATE_APPLICATION, {
                        model: application,
                        onSuccess: _.bind(function() {
                            this.triggerEvent(events.MAKE_INTERVIEW_OFFER, {
                                model: offer,
                                application: application,
                                onSuccess: _.bind(this.onSaveSuccess, this, options),
                                onError: _.bind(this.onSaveError, this, options)
                            });
                        }, this),
                        onError: options.error
                    });
                } else {
                    this.triggerEvent(events.MAKE_INTERVIEW_OFFER, {
                        model: offer,
                        application: application,
                        onSuccess: _.bind(this.onSaveSuccess, this, options),
                        onError: _.bind(this.onSaveError, this, options)
                    });
                }
            },

            onSaveSuccess: function(options, result) {
                options.success();
                this.destroy();
            },

            onSaveError: function(options, result) {
                options.error();
            }
        }
    );

    var RescindInterviewOfferModal = ui.modal.views.ModalFormView.extend(
        /** @lends module:widget/offer/views~RescindInterviewOfferModal.prototype */
        {

            /**
             * Rescind Interview Offer Modal
             * @constructs
             * @augments module:ui/modal/view~ModalFormView
             * @param {Object} options
             * @param {Application} options.model
             *   Application w/ offer to rescind
             * @param {InterviewOffer} [options.offer] InterviewOffer model
             *   Use this parameter to propagate changes to the provided model.
             *   An example of this is in the OffersGridView.
             */
            initialize: function(options) {
                options = _.extend({
                    title: 'Rescind Interview Offer'
                }, options);

                this.model = options.model;
                this.currentUser = new api.models.User({id: 'CURRENT'});
                this.currentTenant = this.currentUser.get_tenant();
                this.offer = options.offer || new api.models.InterviewOffer();
                this.loader = new api.loader.ApiLoader([{
                    instance: this.model,
                    withRelated: ['interview_offers', 'requisition']
                }], {triggerAlways: true});
                this.initialized = false;

                //bind events
                this.listenTo(this.loader, 'loaded', this.onLoaded);

                options.fields = [
                    this.typeField(this.offer),
                    this.candidateField(this.model),
                    this.expirationField(this.offer),
                    this.requisitionField(this.model.get_requisition())
                ];

                options.actions = [
                    new ui.form.actions.ButtonAction({
                        label: 'Rescind Offer',
                        primary: true,
                        dirtyRequired: false,
                        handler: _.bind(this.onRescind, this)
                    }),
                    new ui.form.actions.ButtonAction({
                        label: 'Cancel',
                        primary: false,
                        handler: _.bind(this.onCancel, this)
                    })
                ];

                //load data
                this.loader.load();
                RescindInterviewOfferModal.__super__.initialize.call(this, options);

                this.initialized = true;
            },

            typeField: function(model) {
                return new ui.form.fields.DropdownField({
                    name: 'type',
                    model: model,
                    label: 'Offer',
                    choices: [
                        { label: '', value: null },
                        { label: 'Phone Interview', value: 'PHONE' },
                        { label: 'In-house Interview', value: 'IN_HOUSE' }
                    ],
                    enabled: false
                });
            },

            candidateField: function(model) {
                return new ui.form.fields.InputField({
                    name: 'user_id',
                    model: model,
                    label: 'Developer',
                    enabled: false
                });
            },

            expirationField: function(model) {
                return new ui.form.fields.DateField({
                    name: 'expires',
                    model: model,
                    label: 'Expiration',
                    enabled: false
                });
            },

            requisitionField: function(model) {
                return new ui.form.fields.InputField({
                    name: 'title',
                    model: model,
                    label: 'Requisition',
                    enabled: false
                });
            },

            render: function() {
                if(this.initialized && this.loader.isLoaded()) {
                    this.validate();
                    RescindInterviewOfferModal.__super__.render.call(this);
                }
                return this;
            },

            onLoaded: function() {
                // TODO Add sanity check to ensure that the ID of this.offer when
                // passed in matches the ID retrieved by the next line of code.
                var offer = _.first(this.model.get_interview_offers().where({
                    status: 'PENDING'
                }));
                if(offer) {
                    offer.clone({
                        to: this.offer
                    });
                }
                this.render();
            },

            onRescind: function(options) {
                this.triggerEvent(events.RESCIND_INTERVIEW_OFFER, {
                    model: this.offer,
                    application: this.model,
                    onSuccess: _.bind(this.onRescindSuccess, this, options),
                    onError: _.bind(this.onRescindError, this, options)
                });
            },

            onRescindSuccess: function(options, result) {
                this.destroy();
            },

            onRescindError: function(options, result) {
                options.error();
            }
        }
    );


    var InterviewOfferDetailsModal = core.view.View.extend(
        /** @lends module:widget/offer/views~InterviewOfferDetailsModal.prototype */
        {

            /**
             * InterviewOfferDetailsModal View
             * @constructs
             * @augments module:core/view~View
             * @param {Object} options
             * @param {InterviewOffer} options.model InterviewOffer model
             * @param {Function} options.onOk Function to invoke on Ok
             * @param {String} [options.message] message to display
             */
            initialize: function(options) {
                this.model = options.model;
                this.onOk = options.onOk;
                this.message = options.message || '';
                this.template =  _.template(interview_offer_details_template);
                this.modelWithRelated = ['tenant', 'application__requisition'];
                this.loader = new api.loader.ApiLoader([
                    { instance: this.model, withRelated: this.modelWithRelated }
                ]);

                //bind events
                this.listenTo(this.loader, 'loaded', this.render);

                //load data
                this.loader.load();
            },

            render: function() {
                if (this.loader.isLoaded()) {
                    var context = {
                        message: this.message,
                        model: this.model.toJSON({
                            withRelated: this.modelWithRelated
                        }),
                        type: this._formatInterviewTypeString()
                    };
                    this.$el.html(this.template(context));
                }
                return this;
            },

            onCancel: function() {
                return true;
            },

            onClose: function() {
                return true;
            },

            _formatInterviewTypeString: function() {
                var interviewType = 'In-house';
                if (this.model.get_type() === 'PHONE') {
                    interviewType = 'Phone';
                }
                return interviewType;
            }
        }
    );

    var AcceptInterviewOfferModal = ui.modal.views.ModalView.extend(
        /** @lends module:widget/offer/views~AcceptInterviewOfferModal.prototype */
        {
            /**
             * AcceptInterviewOfferModal View
             * @constructs
             * @augments module:ui/modal/view~ModalView
             * @param {Object} options
             * @param {InterviewOffer} options.model InterviewOffer model
             */
            initialize: function(options) {
                var that = this;
                options = _.extend({
                    title: 'Accept Interview Offer',
                    viewOrFactory: new InterviewOfferDetailsModal({
                        model: options.model,
                        message: 'Upon acceptance your identity will be revealed to ' +
                            options.model.get_tenant().get_name() + ' so that your ' +
                            'interview can be scheduled.',
                        onOk: function() {
                            this.triggerEvent(events.ACCEPT_INTERVIEW_OFFER, {
                                model: this.model,
                                application: this.model.get_application(),
                                onSuccess: _.bind(that.onAcceptSuccess, this, options)
                            });
                            return true;
                        }
                    })
                }, options);
                AcceptInterviewOfferModal.__super__.initialize.call(this, options);
            },

            onAcceptSuccess: function(model, response) {
                this.destroy();
            }
        }
    );

    var DeclineInterviewOfferModal = ui.modal.views.ModalView.extend(
        /** @lends module:widget/offer/views~DeclineInterviewOfferModal.prototype */
        {
            /**
             * DeclineInterviewOfferModal View
             * @constructs
             * @augments module:ui/modal/view~ModalView
             * @param {Object} options
             * @param {InterviewOffer} options.model InterviewOffer model
             */
            initialize: function(options) {
                var that = this;
                options = _.extend({
                    title: 'Decline Interview Offer',
                    viewOrFactory: new InterviewOfferDetailsModal({
                        model: options.model,
                        message: 'You won\'t be able to change your decision ' +
                            'after clicking Ok.',
                        onOk: function() {
                            this.triggerEvent(events.DECLINE_INTERVIEW_OFFER, {
                                model: this.model,
                                application: this.model.get_application(),
                                onSuccess: _.bind(that.onDeclineSuccess, this, options)
                            });
                            return true;
                        }
                    })
                }, options);
                DeclineInterviewOfferModal.__super__.initialize.call(this, options);
            },

            onDeclineSuccess: function(model, response) {
                this.destroy();
            }
        }
    );

    return {
        InterviewOfferBriefView: InterviewOfferBriefView,
        InterviewOfferBriefsView: InterviewOfferBriefsView,
        MakeInterviewOfferModal: MakeInterviewOfferModal,
        RescindInterviewOfferModal: RescindInterviewOfferModal,
        AcceptInterviewOfferModal: AcceptInterviewOfferModal,
        DeclineInterviewOfferModal: DeclineInterviewOfferModal
    };
});
