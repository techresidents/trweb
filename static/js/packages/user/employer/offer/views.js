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

            this.offers = this.currentTenant.get_interview_offers()
                .filterBy({
                    candidate_id: this.model.id,
                    application__requisition__status: 'OPEN'
                })
                .orderBy('created__desc');

            this.requisitions = this.currentTenant.get_requisitions()
                .filterBy({ status: 'OPEN' })
                .orderBy('created__desc');

            this.loader = new api.loader.ApiLoader([
                { instance: this.offers },
                { instance: this.requisitions }
            ]);

            //bind events
            //listen to session for our collection to be removed. This event will
            //be fired when a new offer is created. When this happens we
            //should re-fetch the query to update the offers view.
            this.listenTo(this.session, 'remove:' + this.offers.key(), this.onRemove);
            this.listenTo(this.loader, 'loaded', this.render);

            //load data
            this.loader.load();

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
            if(this.loader.isLoaded() && this.offersView) {
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
            this.offers.fetch({
                success: _.bind(this.render, this)
            });
        }
    });

    return {
        UserOffersView: UserOffersView
    };
});
