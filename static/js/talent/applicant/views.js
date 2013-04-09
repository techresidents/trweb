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
    'ui/date/views',
    'ui/paginator/views',
    'talent/applicant/eval/views',
    'talent/applicant/log/views',
    'talent/applicant/summary/views',
    'talent/applicant/tracker/views',
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
    date_views,
    paginator_views,
    applicant_eval,
    applicant_log,
    applicant_summary,
    applicant_tracker,
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
            this.filtersView = new applicant_tracker.TrackerFiltersView({
                collection: this.collection,
                query: this.query,
                horizontal: true
            });

            this.gridView = new applicant_tracker.TrackerGridView({
                collection: this.collection,
                query: this.query
            });

            this.paginatorView = new paginator_views.PaginatorView({
                maxPages: 10,
                collection: this.collection,
                query: this.query
            });
        },

        classes: function() {
            return ['tracker'];
        },
        
        render: function() {
            this.$el.html(this.template());
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.filtersView, '.content');
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
            this.model = options.model;
            
            //bind events
            this.listenTo(this.model, 'change', this.render);

            //load data
            this.loader = new api_loader.ApiLoader([{
                instance: this.model
            }]);
            this.loader.load();

            //child views
            this.summaryView = null;
            this.evalView = null;
            this.logsView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [this.summaryView, this.evalView, this.logsView];
        },

        initChildViews: function() {
            this.summaryView = new applicant_summary.ApplicationSummaryView({
                model: this.model
            });
            this.evalView = new applicant_eval.TeamEvalView({
                model: this.model
            });
            this.logsView = new applicant_log.ApplicationLogsView({
                model: this.model
            });
        },

        classes: function() {
            return ['application'];
        },
        
        render: function() {
            var context = {
                model: this.model.toJSON()
            };

            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.summaryView, '.summary-container');
            this.append(this.evalView, '.eval-container');
            this.append(this.logsView, '.log-container');

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
            this.action = 'Make Interview Offer';

            //loader
            this.loader = new api_loader.ApiLoader([{
                instance: this.model,
                withRelated: ['requisition']
            }]);
            this.loader.load();

            //bind events
            this.listenTo(this.loader, 'loaded', this.render);

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
                inputSelector: 'input.expiration'
            });
            this.dateView.setDate(expirationDate);
        },

        context: function() {
            return {
                application: this.model.toJSON({
                    withRelated: ['requisition']
                })
            };
        },
        
        render: function() {
            if(this.loader.isLoaded()) {
                var context = this.context();
                this.$el.html(this.template(context));
                this.append(this.dateView);
            } else {
                this.$el.html();
            }
            return this;
        },

        onClose: function() {
            return true;
        },

        onCancel: function() {
            return true;
        },

        onAction: function() {
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
            this.action = 'Rescind Interview Offer';

            //bind events
            this.listenTo(this.loader, 'loaded', this.render);

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

        onCancel: function() {
            return true;
        },

        onAction: function() {
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
