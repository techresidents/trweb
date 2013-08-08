define([
    'jquery',
    'underscore',
    'core',
    'api',
    'ui',
    'widget',
    'text!./templates/offers.html'
], function(
    $,
    _,
    core,
    api,
    ui,
    widget,
    offers_template) {

    var UserOffersView = core.view.View.extend({

        /**
         * User offers view
         * @constructs
         * @param {Object} options
         * @param {User} options.model User model
         */
        initialize: function(options) {
            this.model = options.model;
            this.template = _.template(offers_template);

            this.session = this.model.session;
            this.currentUser = new api.models.User({id: 'CURRENT'});
            this.currentTenant = this.currentUser.get_tenant();
            this.offersLoaded = false;
            this.requisitionsLoaded = false;

            this.offers = this.currentTenant.get_interview_offers();
            this.offersQuery = this.offers.filterBy({
                candidate_id: this.model.id,
                application__requisition__status: 'OPEN'
            }).orderBy('created__desc');
            this.offersKey = this.session.expandKey(this.offers.key(), this.offersQuery);

            this.requisitions = this.currentTenant.get_requisitions();
            this.requisitionsQuery = this.requisitions.filterBy({
                status: 'OPEN'
            }).orderBy('created__desc');

            //bind events
            //listen to session for our collection to be removed. This event will
            //be fired when a new offer is created. When this happens we
            //should re-fetch the query to update the offers view.
            this.listenTo(this.session, 'remove:' + this.offersKey, this.onRemove);
            this.listenTo(this.offers, 'loaded', this.onOffersLoaded);

            //load data
            //TODO replace w/ loader when loader can support queries
            this.offersQuery.fetch({
                success: _.bind(function() {
                    this.offersLoaded = true;
                    this.render();
                }, this)
            });
            this.requisitionsQuery.fetch({
                success: _.bind(function() {
                    this.requisitionsLoaded = true;
                    this.render();
                }, this)
            });

            // init child views
            this.offersView = null;
            this.initChildViews();
        },

        events: {
            'click .user-offers-make-offer': 'onClick'
        },

        childViews: function() {
            return [this.offersView];
        },

        initChildViews: function() {
            this.offersView = new widget.offer.views.InterviewOfferBriefsView({
                collection: this.offers
            });
        },

        context: function() {
            return {
                offers: this.offers.toJSON(),
                requisitions: this.requisitions.toJSON()
            };
        },

        render: function() {
            if(this.offersLoaded &&
               this.requisitionsLoaded &&
               this.offersView) {
                var context = this.context();
                this.$el.html(this.template(context));
                if(this.requisitions.length) {
                    this.append(this.offersView);
                }
            }
            return this;
        },

        onClick: function(e) {
            var modal = new widget.offer.views.MakeInterviewOfferModal({
                model: this.model
            });
            this.append(modal);
        },

        onRemove: function() {
            this.offersQuery.fetch();
        },

        onOffersLoaded: function(instance) {
            if(instance === this.offers) {
                this.render();
            }
        }
    });

    return {
        UserOffersView: UserOffersView
    };
});
