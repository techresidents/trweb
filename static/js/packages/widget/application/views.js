define([
    'jquery',
    'underscore',
    'core',
    'api',
    'ui',
    'events',
    'text!./templates/application_brief.html',
    'text!./templates/vote_buttons.html'
], function(
    $,
    _,
    core,
    api,
    ui,
    events,
    application_brief_template,
    vote_buttons_template) {

    var VoteButtonsView = core.view.View.extend({

        /**
         * Application Vote Button View.
         * @constructor
         * @param {Object} options
         * @param {Application} options.model Application model
         */
        initialize: function(options) {
            this.applicationModel = options.applicationModel;
            this.employeeModel = new api.models.User({id: 'CURRENT'});
            this.voteModel = null;
            this.template = _.template(vote_buttons_template);

            // load application votes
            this.appVotesCollection = this.applicationModel.get_application_votes();
            this.listenTo(this.appVotesCollection, 'reset', this.onReset);

            // Since we retrieved all application votes on the application, we
            // need to filter the collection down to just this employee's vote
            this.appVoteQuery = this.appVotesCollection.filterBy({
                user_id: this.employeeModel.id
            });
            this.appVoteQuery.fetch();
        },

        buttonGroupSelector: '.btn-group button',

        events: {
            'click .active': 'onUnclick',
            'click button:not([class="active"])': 'onClick'
        },

        classes: function() {
            return ['w-vote-buttons'];
        },

        render: function() {
            var context = {
                toggled: this.voteModel ? this.voteModel.get_yes() : null
            };
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));

            return this;
        },

        onReset: function() {
            // Load Score if it exists or create new one
            if (this.appVotesCollection.length) {
                this.voteModel = this.appVotesCollection.first();
            } else {
                this.voteModel = new api.models.ApplicationVote({
                    application_id: this.applicationModel.id,
                    yes: null
                });
            }
            // Display the vote
            this.render();
        },

        onClick: function(e) {
            var currentTarget = this.$(e.currentTarget);
            this.select(currentTarget);
            this.addButtonColor(currentTarget);
            this._save(this._determineVoteValue(currentTarget));
        },

        onUnclick: function(e) {
            var currentTarget = this.$(e.currentTarget);
            this.deselect(currentTarget, e);
            this._save(this._determineVoteValue(currentTarget));
        },

        addButtonColor: function(target) {
            // Only set button color if button wasn't already active
            if (target.hasClass('yes-vote')) {
                // Add green color to Yes button
                this.$(this.buttonGroupSelector).removeClass('btn-danger');
                target.addClass('btn-success');
            }
            else if (target.hasClass('no-vote')) {
                // Add red color to No button
                this.$(this.buttonGroupSelector).removeClass('btn-success');
                target.addClass('btn-danger');
            }
        },

        select: function(target) {
            // Append the class 'active' to the element so we know when
            // saving which button is toggled.  If we didn't do this, then
            // bootstrap would add this class after our handlers finished.
            // Doing this will hopefully prevent any state-related bugs.
            if (!target.hasClass('active')) {
                target.addClass('active');
            }
        },

        deselect: function(target, e) {
            if (target.hasClass('active')) {
                // Stop event propogation to prevent bootstrap from
                // adding the class 'active' to the button downstream.
                e.stopImmediatePropagation();
                // Remove any button colors
                this.$(this.buttonGroupSelector).removeClass('btn-success btn-danger');
                // Deselect button
                target.removeClass('active');
            }
        },

        _determineVoteValue: function(target) {
            // Determine which button is set
            var voteValue = null; // null is a valid vote state
            if (target.hasClass('active') && target.hasClass('yes-vote')) {
                voteValue = true;
            }
            else if (target.hasClass('active') && target.hasClass('no-vote')) {
                voteValue = false;
            }
            return voteValue;
        },

        /**
         * Save
         * @param e
         * @private
         */
        _save: function(vote) {
            var attributes = {
                yes: vote
            };
            var eventBody = _.extend({
                model: this.voteModel,
                application: this.applicationModel
            }, attributes);
            this.triggerEvent(events.CAST_APPLICANT_VOTE, eventBody);
        }
    });


    var ApplicationBriefView = core.view.View.extend({

        /**
         * Application brief view.
         * @constructor
         * @param {Object} options
         * @param {Application} options.model Application model
         */
        initialize: function(options) {
            this.model = options.model;
            this.listenTo(this.model, 'change', this.onAppModelChange);
            this.listenTo(this.model.get_requisition(), 'change', this.onReqModelChange);
            this.employeeModel = new api.models.User({id: 'CURRENT'});
            this.scoreModel = null;
            this.template = _.template(application_brief_template);

            // load application scores
            this.appScoresCollection = this.model.get_application_scores();
            this.listenTo(this.appScoresCollection, 'reset', this.onAppScoresReset);

            // child views
            this.voteButtonsView = null;
            this.ratingCommunicationView = null;
            this.ratingTechnicalView = null;
            this.ratingCultureView = null;
            this.initChildViews();

            // load application with requisition
            this.loader = new api.loader.ApiLoader([
                { instance: this.model, withRelated: ['requisition'] }
            ]);
            this.loader.load();

            // Since we retrieved all application scores on the application, we
            // need to filter the collection down to just this employee's score
            this.appScoreQuery = this.appScoresCollection.filterBy({
                user_id: this.employeeModel.id
            });
            this.appScoreQuery.fetch();
        },

        ratingCommunicationSelector: '.w-application-brief-communication',

        ratingTechnicalSelector: '.w-application-brief-technical',

        ratingCultureSelector: '.w-application-brief-culture',

        voteButtonsSelector: '.w-application-brief-vote-buttons-container',

        events: {
            'change .w-application-brief-culture': 'onCulturalFitScoreChange',
            'change .w-application-brief-technical': 'onTechnicalScoreChange',
            'change .w-application-brief-communication': 'onCommunicationScoreChange'
        },

        childViews: function() {
            return [
                this.voteButtonsView,
                this.ratingCommunicationView,
                this.ratingTechnicalView,
                this.ratingCultureView
            ];
        },

        initChildViews: function() {
            this.voteButtonsView = new VoteButtonsView({
                applicationModel: this.model
            });
            this.ratingCommunicationView = new ui.rating.stars.views.RatingStarsView({
                label: 'Comm'
            });
            this.ratingTechnicalView = new ui.rating.stars.views.RatingStarsView({
                label: 'Tech'
            });
            this.ratingCultureView = new ui.rating.stars.views.RatingStarsView({
                label: 'Fit '
            });
        },

        classes: function() {
            return ['w-application-brief'];
        },

        render: function() {
            var requisitionTitle = this.model.get_requisition().get_title();
            var context = {
                model: this.model.toJSON(),
                req_name: requisitionTitle || this.model.get_requisition_id()
            };
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));

            // set scores in score views
            if (this.scoreModel) {
                this.ratingCommunicationView.setRating(
                    this.scoreModel.get_communication_score()
                );
                this.ratingTechnicalView.setRating(
                    this.scoreModel.get_technical_score()
                );
                this.ratingCultureView.setRating(
                    this.scoreModel.get_cultural_fit_score()
                );
            }

            this.append(this.voteButtonsView, this.voteButtonsSelector);
            this.append(this.ratingCommunicationView, this.ratingCommunicationSelector);
            this.append(this.ratingTechnicalView, this.ratingTechnicalSelector);
            this.append(this.ratingCultureView, this.ratingCultureSelector);

            return this;
        },

        onAppModelChange: function() {
            this.render();
        },

        onReqModelChange: function() {
            this.render();
        },

        onAppScoresReset: function() {
            // Load Score if it exists or create new one
            if (this.appScoresCollection.length) {
                this.scoreModel = this.appScoresCollection.first();
            } else {
                this.scoreModel = new api.models.ApplicationScore({
                    application_id: this.model.id,
                    technical_score: 0,
                    communication_score: 0,
                    cultural_fit_score: 0
                });
            }
            // Display the score
            this.render();
        },

        /**
         * Listen for changes to the cultural fit rating
         * @param e JQuery event
         * @param eventBody
         *      value: new score
         */
        onCulturalFitScoreChange: function(e, eventBody) {
            this._saveScore({cultural_fit_score: eventBody.value});
        },

        onTechnicalScoreChange: function(e, eventBody) {
            this._saveScore({technical_score: eventBody.value});
        },

        onCommunicationScoreChange: function(e, eventBody) {
            this._saveScore({communication_score: eventBody.value});
        },

        _saveScore: function(attributes) {
            var eventBody = _.extend({
                model: this.scoreModel,
                application: this.model
            }, attributes);
            this.triggerEvent(events.SCORE_APPLICANT, eventBody);
        }
    });

    ApplicationBriefView.Factory = core.factory.buildFactory(ApplicationBriefView);

    
    var ApplicationBriefsView = ui.collection.views.CollectionView.extend({

        /**
         * Application briefs view
         * @constructor
         * @param {Object} options
         * @param {ApplicationCollection} options.collection application collection
         */
        initialize: function(options) {
            options.viewFactory = new ApplicationBriefView.Factory();
            ApplicationBriefsView.__super__.initialize.call(this, options);
        },

        classes: function() {
            var result = ApplicationBriefsView.__super__.classes.call(this);
            result.push('w-application-briefs');
            return result;
        }
    });

    return {
        ApplicationBriefView: ApplicationBriefView,
        ApplicationBriefsView: ApplicationBriefsView
    };
});
