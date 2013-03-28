define([
    'jquery',
    'underscore',
    'api/loader',
    'api/models',
    'core/date',
    'core/factory',
    'core/format',
    'core/view',
    'ui/ac/matcher',
    'ui/ac/views',
    'ui/date/views',
    'ui/paginator/views',
    'talent/applicant/grid',
    'talent/applicant/filter',
    'talent/events',
    'text!talent/applicant/templates/application.html',
    'text!talent/applicant/templates/make_interview_offer.html',
    'text!talent/applicant/templates/rescind_interview_offer.html',
    'text!talent/applicant/templates/tracker.html'
], function(
    $,
    _,
    api_loader,
    api,
    date,
    factory,
    fmt,
    view,
    ac_matcher,
    ac_views,
    date_views,
    paginator_views,
    tracker_grid,
    tracker_filter,
    talent_events,
    application_template,
    make_interview_offer_template,
    rescind_interview_offer_template,
    tracker_template) {

    /**
     * Tracker view.
     * @constructor
     * @param {Object} options
     *   collection: {ApplicationCollection} collection (required)
     *   query: {ApiQuery} query (required)
     */
    var TrackerView = view.View.extend({
            
        events: {
        },

        initialize: function(options) {
            this.template =  _.template(tracker_template);
            this.collection = options.collection;
            this.query = options.query.withRelated('requisition');
            this.query.fetch();

            //child views
            this.filtersView = null;
            this.gridView = null;
            this.paginatorView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [this.filtersView, this.gridView, this.paginatorView];
        },

        initChildViews: function() {
            this.matcher = new ac_matcher.CollectionMatcher({
                collection: this.collection,
                stringify: function(model) {
                    return model.get_requisition().get_title() + ' (' + model.id + ')';
                }
            });
            this.macView = new ac_views.MultiAutoCompleteView({
                collection: this.collection.clone(),
                matcher: this.matcher
            });
            this.filtersView = new tracker_filter.TrackerFiltersView({
                collection: this.collection,
                query: this.query,
                horizontal: true
            });

            this.gridView = new tracker_grid.TrackerGridView({
                collection: this.collection,
                query: this.query
            });

            this.paginatorView = new paginator_views.PaginatorView({
                maxPages: 10,
                collection: this.collection,
                query: this.query
            });
        },

        
        render: function() {
            this.$el.html(this.template());
            this.append(this.filtersView, '.content');
            this.append(this.macView, '.content');
            this.append(this.gridView, '.content');
            this.append(this.paginatorView, '.content');
            return this;
        }
    });

    /**
     * Application view.
     * @constructor
     * @param {Object} options
     */
    var ApplicationView = view.View.extend({
            
        events: {
        },

        initialize: function(options) {
            this.template =  _.template(application_template);

            //child views
            this.initChildViews();
        },

        childViews: function() {
            return [];
        },

        initChildViews: function() {
        },

        
        render: function() {
            this.$el.html(this.template());
            return this;
        }
    });

    /**
     * MakeInterviewOfferView
     * @constructor
     * @param {object} options Options object
     * @param {object} options.model Application model
     */
    var MakeInterviewOfferView = view.View.extend({
            
        events: {
            'submit form': 'onSubmit'
        },

        initialize: function(options) {
            this.template =  _.template(make_interview_offer_template);
            this.model = options.model;

            //child views
            this.dateView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [this.dateView];
        },

        initChildViews: function() {
            var expirationDate = new date.Date();
            expirationDate.add(new date.Interval(0, 0, 7));
            this.dateView = new date_views.DatePickerDropView({
                inputView: this,
                inputSelector: 'input'
            });
            this.dateView.setDate(expirationDate);
        },
        
        render: function() {
            this.$el.html(this.template());
            this.append(this.dateView);
            return this;
        },

        onClose: function() {
            return true;
        },

        onSave: function() {
            var result = false;
            var expires = this.dateView.getDate();
            var type = this.$('select :selected').val();
            if(expires && type) {
                var interviewOffer = new api.InterviewOffer({
                    expires: expires,
                    type: type
                });
                this.triggerEvent(talent_events.MAKE_INTERVIEW_OFFER, {
                    application: this.model,
                    model: interviewOffer
                });
                result = true;
            }
            return result;
        },

        onSubmit: function(e) {
            return false;
        }
    });

    /**
     * RescindInterviewOfferView
     * @constructor
     * @param {object} options Options object
     * @param {object} options.model Application model
     */
    var RescindInterviewOfferView = view.View.extend({
            
        initialize: function(options) {
            this.template =  _.template(rescind_interview_offer_template);
            this.model = options.model;
            this.interviewOffers = this.model.get_interview_offers();
            this.loader = new api_loader.ApiLoader([{
                instance: this.model,
                withRelated: ['interview_offers', 'requisition']
            }]);

            //bind events
            this.listenTo(this.interviewOffers, 'reset', this.render);

            this.loader.load();
        },

        getOffer: function() {
            var offer = _.first(this.interviewOffers.where({
                status: 'PENDING'
            }));
            return offer;
        },

        context: function() {
            var requisition = this.model.get_requisition();
            var offer = this.getOffer();

            var result = {
                fmt: fmt,
                requisition: requisition.toJSON(),
                offer: offer.toJSON()
            };

            switch(offer.get_type()) {
                case 'IN_HOUSE':
                      result.offer.type = 'In-house Interview';
                      break;

                case 'PHONE':
                      result.offer.type = 'Phone Interview';
                      break;
            }

            return result;
        },

        render: function() {
            if(this.loader.isLoaded()) {
                var context = this.context();
                this.$el.html(this.template(context));
            } else {
                this.$el.html();
            }
            return this;
        },

        onClose: function() {
            return true;
        },

        onSave: function() {
            var applicationStatus = this.$('select :selected').val();
            this.triggerEvent(talent_events.RESCIND_INTERVIEW_OFFER, {
                model: this.getOffer(),
                application: this.model,
                applicationStatus: applicationStatus
            });
            return true;
        }
    });


    return {
        ApplicationView: ApplicationView,
        MakeInterviewOfferView: MakeInterviewOfferView,
        RescindInterviewOfferView: RescindInterviewOfferView,
        TrackerView: TrackerView
    };
});
