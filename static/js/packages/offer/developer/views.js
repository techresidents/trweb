define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'events',
    'ui',
    'widget',
    'text!./templates/offers.html',
    'text!./templates/offer.html',
    'text!./templates/empty.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    events,
    ui,
    widget,
    offers_template,
    offer_template,
    empty_template) {

    var DeveloperOfferView = core.view.View.extend(
        /** @lends module:offer/developer/views~DeveloperOfferView.prototype */
        {
            contentSelector: '.developer-offer-details-container',

            events: {
                'click .accept-offer-btn': 'onAccept',
                'click .decline-offer-btn': 'onDecline'
            },

            /**
             * Developer Offer Page View
             * @constructs
             * @augments module:core/view~View
             * @param {Object} options
             * @param {InterviewOffer} options.model InterviewOffer model
             */
            initialize: function(options) {
                this.template =  _.template(offer_template);
                this.model = options.model;
                this.modelWithRelated = ['tenant', 'application__requisition__requisition_technologies__technology'];
                this.loader = new api.loader.ApiLoader([
                    { instance: this.model, withRelated: this.modelWithRelated }
                ]);

                //bind events
                this.listenTo(this.loader, 'loaded', this.render);
                this.listenTo(this.model, 'change', this.render);

                //load data
                this.loader.load();

                //child views
                this.wishlistView = null;
                this.initChildViews();
            },

            childViews: function() {
                return [
                    this.wishlistView
                ];
            },

            initChildViews: function() {
                this.wishlistView = new widget.skill.views.SkillsView({
                    collection: this.model.
                        get_application().
                        get_requisition().
                        get_requisition_technologies()
                });
            },

            classes: function() {
                return ['developer-offer'];
            },

            render: function() {
                if (this.loader.isLoaded()) {
                    var context = {
                        fmt: this.fmt,
                        model: this.model.toJSON({
                            withRelated: this.modelWithRelated
                        }),
                        requisition: this.model.
                            get_application().
                            get_requisition().
                            toJSON(),
                        interviewType: this._formatInterviewTypeString()
                    };
                    this.$el.html(this.template(context));
                    this.$el.attr('class', this.classes().join(' '));
                    this.append(this.wishlistView, '.offer-wishlist-container');
                }
                return this;
            },

            onAccept: function() {
                var modalView = new widget.offer.views.AcceptInterviewOfferModal({
                    model: this.model
                });
                this.append(modalView);
            },

            onDecline: function() {
                var modalView = new widget.offer.views.DeclineInterviewOfferModal({
                    model: this.model
                });
                this.append(modalView);
            },

            _formatInterviewTypeString: function() {
                var interviewType = 'In-House';
                if (this.model.get_type() === 'PHONE') {
                    interviewType = 'Phone';
                }
                return interviewType;
            }
        }
    );

    var OffersGridView = ui.grid.views.GridView.extend(
        /** @lends module:offer/developer/views~OffersGridView.prototype */
        {
            /**
             * Offers Grid view.
             * @constructs
             * @augments module:ui/grid/view~GridView
             * @param {Object} options
             * @param {InterviewOfferCollection} options.collection
             *  InterviewOffer collection
             */
            initialize: function(options) {
                var config = {
                    columns: [
                        OffersGridView.employerColumn(),
                        OffersGridView.requisitionColumn(),
                        OffersGridView.interviewTypeColumn(),
                        OffersGridView.createdColumn(),
                        OffersGridView.expiresColumn(),
                        OffersGridView.statusColumn()
                    ]
                };

                options = _.extend({
                    config: config
                }, options);

                ui.grid.views.GridView.prototype.initialize.call(this, options);
            },

            classes: function() {
                var result = ui.grid.views.GridView.prototype.classes.call(this);
                result = result.concat(['developer-offers-grid']);
                return result;
            }
        }, {
            employerColumn: function() {
                return {
                    column: 'Employer',
                    headerCellView: new ui.grid.views.GridHeaderCellView.Factory({
                        sort: 'tenant__name'
                    }),
                    cellView: new ui.grid.views.GridCellView.Factory({
                        valueAttribute: 'tenant__name'
                    })
                };
            },

            requisitionColumn: function() {
                return {
                    column: 'Position',
                    headerCellView: new ui.grid.views.GridHeaderCellView.Factory({
                        sort: 'application__requisition__title'
                    }),
                    cellView: new ui.grid.views.GridLinkCellView.Factory(function(options) {
                        var requisition = options.model.get_application().get_requisition();
                        return {
                            href: '/d/offer/' + options.model.id + '/',
                            value: requisition.get_title()
                        };
                    })
                };
            },

            interviewTypeColumn: function() {
                return {
                    column: 'Interview Type',
                    headerCellView: new ui.grid.views.GridHeaderCellView.Factory({
                        sort: 'type'
                    }),
                    cellView: new ui.grid.views.GridCellView.Factory({
                        valueAttribute: 'type',
                        context: function(defaultContext) {
                            defaultContext.value = core.string.titleText(defaultContext.value);
                            return defaultContext;
                        }
                    })
                };
            },

            createdColumn: function() {
                return {
                    column: 'Created',
                    headerCellView: new ui.grid.views.GridHeaderCellView.Factory({
                        sort: 'created'
                    }),
                    cellView: new ui.grid.views.GridDateCellView.Factory({
                        valueAttribute: 'created',
                        format: 'MM/dd/yy'
                    })
                };
            },

            expiresColumn: function() {
                return {
                    column: 'Expires',
                    headerCellView: new ui.grid.views.GridHeaderCellView.Factory({
                        sort: 'expires'
                    }),
                    cellView: new ui.grid.views.GridDateCellView.Factory({
                        valueAttribute: 'expires',
                        format: 'MM/dd/yy'
                    })
                };
            },

            statusColumn: function() {
                return {
                    column: 'Status',
                    headerCellView: new ui.grid.views.GridHeaderCellView.Factory({
                        sort: 'status'
                    }),
                    cellView: new ui.grid.views.GridCellView.Factory({
                        valueAttribute: 'status',
                        context: function(defaultContext) {
                            defaultContext.value = core.string.titleText(defaultContext.value);
                            return defaultContext;
                        }
                    })
                };
            }
        }
    );

    var OffersEmptyView = ui.template.views.TemplateView.extend(
        /** @lends module:offer/developer/views~DeveloperOffersView.prototype */
        {
           /**
            * Offers Empty View
            * @constructs
            * @augments module:ui/template/view~TemplateView
            * @param {Object} options
            * @classdesc
            * View to display when user has no offers
            */
            initialize: function(options) {
                options = _.extend({
                    template: empty_template,
                    classes:  ['developer-offers-empty']
                }, options);
                OffersEmptyView.__super__.initialize.call(this, options);
            }
        }
    );

    var DeveloperOffersView = core.view.View.extend(
        /** @lends module:offer/developer/views~DeveloperOffersView.prototype */
        {

            contentSelector: '.developer-offers-container',

            /**
             * Developer Offers Page View
             * @constructs
             * @augments module:core/view~View
             * @param {Object} options
             * @param {InterviewOfferCollection} options.collection InterviewOffer collection
             */
            initialize: function(options) {
                this.template =  _.template(offers_template);
                this.collection = options.collection;
                this.collectionWithRelated = ['tenant', 'application__requisition'];
                this.loader = new api.loader.ApiLoader([
                    { instance: this.collection, withRelated: this.collectionWithRelated }
                ]);

                //bind events
                this.listenTo(this.loader, 'loaded', this.render);

                //load data
                this.loader.load();

                //child views
                this.emptyView = null;
                this.gridView = null;
                this.paginatorView = null;
                this.initChildViews();

                // This flag is set to indicate that our child views have been
                // initialized.  There's currently a problem when loading cached
                // collections whereby the loader loads them from cache really quickly
                // which triggers a 'loaded' event, which then invokes 'render' before
                // our views have been created.  Models don't suffer from this
                // problem because if it's cached, the model pulls all the cached
                // data into it's own instance which then prevents the loader from even
                // trying to load the data, and thus no 'loaded' event is triggered.
                this.initialized = true;
            },

            childViews: function() {
                return [
                    this.emptyView,
                    this.gridView,
                    this.paginatorView];
            },

            initChildViews: function() {

                this.emptyView = new OffersEmptyView();

                this.gridView = new OffersGridView({
                    collection: this.collection
                });

                // Page size is determined by the slice. In this case, the
                // mediator specifies a slice of 0-20, which implies pages
                // have 20 entries. This is consistent with the applicant tracker.
                this.paginatorView = new ui.paginator.views.PaginatorView({
                    maxPages: 10,
                    collection: this.collection
                });
            },

            classes: function() {
                return ['developer-offers'];
            },

            render: function() {
                if (this.initialized && this.loader.isLoaded()) {
                    this.$el.html(this.template());
                    this.$el.attr('class', this.classes().join(' '));
                    if (this.collection.length > 0) {
                        this.append(this.gridView, this.contentSelector);
                        this.append(this.paginatorView, this.contentSelector);
                    } else {
                        this.append(this.emptyView, this.contentSelector);
                    }
                }
                return this;
            }
        }
    );

    return {
        DeveloperOfferView: DeveloperOfferView,
        DeveloperOffersView: DeveloperOffersView
    };
});
