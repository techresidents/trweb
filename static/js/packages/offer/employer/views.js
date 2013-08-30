define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'events',
    'ui',
    'text!./templates/offers.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    events,
    ui,
    employer_offers_template) {

    /**
     * Employer Offers View
     * @constructor
     * @param {Object} options
     * @param {InterviewOfferCollection} options.collection InterviewOffer collection
     */
    var EmployerOffersView = core.view.View.extend({

        contentSelector: '.employer-offers-container',

        events: {
        },

        initialize: function(options) {
            this.template =  _.template(employer_offers_template);
            // TODO better to specify withRelated here or in mediator? Perhaps check if it's there and add it if it's not?
            // It's expected that the collection passed to this view
            // has a withRelated field of ['application__requisition']
            this.loader = new api.loader.ApiLoader([
                { instance: this.collection }
            ]);

            //bind events
            this.listenTo(this.loader, 'loaded', this.render);

            //load data
            this.loader.load();

            //child views
            this.filtersView = null;
            this.gridView = null;
            this.paginatorView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [
                this.filtersView,
                this.gridView,
                this.paginatorView];
        },

        initChildViews: function() {

//            this.filtersView = new TrackerFiltersView({
//                collection: this.collection,
//                horizontal: true
//            });

//            this.gridView = new TrackerGridView({
//                collection: this.collection
//            });

//            this.paginatorView = new ui.paginator.views.PaginatorView({
//                maxPages: 10,
//                collection: this.collection
//            });
        },

        classes: function() {
            return ['employer-offers'];
        },

        render: function() {
            if (this.loader.isLoaded()) {
                this.$el.html(this.template());
                this.$el.attr('class', this.classes().join(' '));
                //this.append(this.filtersView, this.contentSelector);
                //this.append(this.gridView, this.contentSelector);
                //this.append(this.paginatorView, this.contentSelector);
            }
            return this;
        }
    });

    return {
        EmployerOffersView: EmployerOffersView
    };
});
