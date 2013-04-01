define([
    'jquery',
    'underscore',
    'jquery.bootstrap',
    'core/array',
    'core/factory',
    'core/view',
    'api/loader',
    'api/models',
    'ui/rating/stars/views',
    'ui/ac/matcher',
    'ui/collection/views',
    'ui/drop/views',
    'ui/select/views',
    'ui/select/models',
    'talent/events',
    'text!talent/user/templates/user.html',
    'text!talent/user/templates/jobprefs.html',
    'text!talent/user/templates/skills.html',
    'text!talent/user/templates/skill.html',
    'text!talent/user/templates/chats.html',
    'text!talent/user/templates/chat.html',
    'text!talent/user/templates/actions.html',
    'text!talent/user/templates/note.html',
    'text!talent/user/templates/application_brief.html',
    'text!talent/user/templates/application_create.html',
    'text!talent/user/templates/requisition_select.html',
    'text!talent/user/templates/vote_buttons.html'
], function(
    $,
    _,
    none,
    array,
    factory,
    view,
    api_loader,
    api,
    ratingstars_views,
    ac_matcher,
    collection_views,
    drop_views,
    select_views,
    select_models,
    talent_events,
    user_template,
    jobprefs_template,
    skills_template,
    skill_template,
    chats_template,
    chat_template,
    actions_template,
    note_template,
    application_brief_template,
    application_create_template,
    requisition_select_template,
    vote_buttons_template) {

    /**
     * User View Events
     */
    var EVENTS = {
        PLAY_CHAT: 'user:playChat'
    };

    /**
     * Talent user job preferences view.
     * @constructor
     * @param {Object} options
     *   model: {User} Represents the developer (required)
     */
    var UserJobPrefsView = view.View.extend({

        positionPrefsSelector: '.position-prefs',
        locationPrefsSelector: '.location-prefs',
        technologyPrefsSelector: '.technology-prefs',
        expandableItemsSelector: '.expandable-list-items',
        slideToggleSelector: '.slide-toggle',
        tooltipSelector: '[rel=tooltip]',

        events: {
            'click .position-prefs .slide-toggle' : 'togglePositionPrefs',
            'click .location-prefs .slide-toggle' : 'toggleLocationPrefs',
            'click .technology-prefs .slide-toggle' : 'toggleTechnologyPrefs'
        },

        initialize: function(options) {
            this.template =  _.template(jobprefs_template);
            this.modelWithRelated = [
                'position_prefs',
                'technology_prefs',
                'location_prefs'
            ];

            //bind events
            this.loader = new api_loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated }
            ], {
                triggerAlways: true
            });
            
            this.loader.load({
                success: _.bind(this.render, this)
            });
        },

        destroy: function() {
            // Need to hide any tooltips since this view could be removed
            // from the DOM before a mouseleave() event fires
            this.$(this.tooltipSelector).tooltip('hide');
            view.View.prototype.destroy.apply(this, arguments);
        },

        render: function() {
            var context = {
                model: this.model.toJSON({ withRelated: this.modelWithRelated }),
                fmt: this.fmt // date formatting
            };
            this.$el.html(this.template(context));

            // Add CSS styles to make preference lists expandable
            var expandableSections = [
                this.positionPrefsSelector,
                this.locationPrefsSelector,
                this.technologyPrefsSelector];
            _.each(expandableSections, this.addExpandableStyle, this);

            this.$(this.tooltipSelector).tooltip(); // Activate tooltips

            return this;
        },

        /**
         * Function to make sections of this view expandable.
         * @param selector A CSS selector specifying the elements
         * to make expandable.
         */
        addExpandableStyle: function(selector) {
            // The current view is broken up into discrete logical
            // sections; each with a unique set of list elements <li>.
            this.$(selector).children('li').each(function(i) {
                // Always show the first 3 list items;
                // make the rest of the items expandable.
                var numItemsAlwaysShown = 3;
                if (i > numItemsAlwaysShown-1) { // subtract 1 for 0-index iterator
                    $(this).addClass('expandable-list-items');
                    $(this).hide(); // default to hiding expandable items
                }
            });
        },

        /**
         * Function to handle expanding/contracting the user's position preference.
         */
        togglePositionPrefs: function() {
            this.toggleExpandedView(this.positionPrefsSelector);
        },

        /**
         * Function to handle expanding/contracting the user's location preference.
         */
        toggleLocationPrefs: function() {
            this.toggleExpandedView(this.locationPrefsSelector);
        },

        /**
         * Function to handle expanding/contracting the user's technology preference.
         */
        toggleTechnologyPrefs: function() {
            this.toggleExpandedView(this.technologyPrefsSelector);
        },

        /**
         * Function to expand/contract preference info.
         * @param selector CSS selector used to target
         * which items are expanded/contracted.
         */
        toggleExpandedView: function(selector) {
            // Toggle the expandable items
            var slideSpeed = 200; //millis
            var itemsSelector = selector + ' ' + this.expandableItemsSelector;
            this.$(itemsSelector).slideToggle(slideSpeed);

            // Update text of toggle button
            var sliderSelector = selector + ' ' + this.slideToggleSelector;
            this.toggleExpandButtonText(sliderSelector);
        },

        /**
         * Update the toggle button's text
         * @param selector CSS selector to find the text to update
         */
        toggleExpandButtonText: function(selector) {
            if ($(selector).text() === 'more') {
                $(selector).text('less');
            } else {
                $(selector).text('more');
            }
        }
    });

    /**
     * Talent user chat view.
     * @constructor
     * @param {Object} options
     *   model: ChatSession model (required)
     *   playerState: PlayerState model (required)
     */
    var UserChatSessionView = view.View.extend({

        events: {
            'click .play': 'play'
        },

        initialize: function(options) {
            this.playerState = options.playerState;
            this.template = _.template(chat_template);
            this.modelWithRelated = ['chat__topic'];
            
            //bind events
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.playerState, 'change:state', this.render);

            this.loader = new api_loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated }
            ]);

            this.loader.load();
        },
        
        render: function() {
            var duration = (this.model.get_end() - this.model.get_start()) / 1000;
            var context = {
                model: this.model.toJSON({ withRelated: this.modelWithRelated }),
                fmt: this.fmt,
                playing: this.isPlaying(),
                duration: duration
            };
            this.$el.html(this.template(context));
            return this;
        },

        /**
         * Returns true if this chat session is playing
         * in the main player (the PlayerView).
         * @return {Boolean}
         */
        isPlaying: function() {
            var result = false;
            var chatSession = this.playerState.chatSession();
            if(chatSession && chatSession.id === this.model.id) {
                result = this.playerState.state() === this.playerState.STATE.PLAYING;
            }
            return result;
        },

        /**
         * Play this chat
         * @param e The DOM event
         */
        play: function(e) {
            var eventBody = {
                chatSession: this.model,
                chatMinute: null // this implies start playing chat from beginning
            };
            this.triggerEvent(EVENTS.PLAY_CHAT, eventBody);
        }
    });

    /**
     * Talent user chat sessions view.
     * @constructor
     * @param {Object} options
     *   collection: {HighlightSessionCollection} (required)
     *   playerState: PlayerState model (required)
     */
    var UserHighlightSessionsView = view.View.extend({

        events: {
        },

        chatSessionsSelector: '#chat-sessions',

        initialize: function(options) {
            this.playerState = options.playerState;
            this.template =  _.template(chats_template);
            this.collectionWithRelated = ['chat_session__chat__topic'];
            
            //bind events
            this.listenTo(this.collection, 'reset', this.onReset);
            this.listenTo(this.collection, 'add', this.onAdd);

            this.loader = new api_loader.ApiLoader([
                { instance: this.collection, withRelated: this.collectionWithRelated }
            ]);

            this.loader.load();

            //child views
            this.childViews = [];
            this.initChildViews();
        },

        initChildViews: function() {
            this.destroyChildViews();
            this.childViews = [];
            this.collection.each(this.createChildView, this);
        },

        render: function() {
            var context = {
                collection: this.collection.toJSON({
                    withRelated: this.collectionWithRelated
                })
            };
            this.$el.html(this.template(context));

            _.each(this.childViews, function(view) {
                this.append(view, this.chatSessionsSelector);
            }, this);
            
            return this;
        },

        createChildView: function(model) {
            var view = new UserChatSessionView({
                model: model.get_chat_session(),
                playerState: this.playerState
            });
            this.childViews.push(view);

            return view;
        },

        onReset: function() {
            this.initChildViews();
            this.render();
        },

        onAdd: function(model) {
            var view = this.createChildView(model);
            this.append(view, this.chatSessionsSelector);
        }
    });

    /**
     * Talent user skill view.
     * @constructor
     * @param {Object} options
     *   model: Skill model (required)
     */
    var UserSkillView = view.View.extend({

        initialize: function(options) {
            this.template = _.template(skill_template);
            this.modelWithRelated = ['technology'];
            
            //bind events
            this.listenTo(this.model, 'change', this.render);

            this.loader = new api_loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated }
            ]);

            this.loader.load();
        },

        render: function() {
            var context = {
                model: this.model.toJSON({
                    withRelated: ['technology']
                })
            };
            this.$el.html(this.template(context));
            return this;
        }
    });

    /**
     * Talent user skills view.
     * @constructor
     * @param {Object} options
     *   collection: {SkillCollection} (required)
     */
    var UserSkillsView = view.View.extend({

        events: {
        },

        noviceSkillsSelector: '#novice-skills',

        proficientSkillsSelector: '#proficient-skills',

        expertSkillsSelector: '#expert-skills',

        childViews: function() {
            var result = this.noviceViews.concat(this.proficientViews).concat(this.expertViews);
            return result;
        },

        initialize: function(options) {
            this.template =  _.template(skills_template);
            this.collectionWithRelated = ['technology'];
            
            //bind events
            this.listenTo(this.collection, 'reset', this.onReset);
            this.listenTo(this.collection, 'add', this.onAdd);

            this.loader = new api_loader.ApiLoader([
                { instance: this.collection, withRelated: this.collectionWithRelated }
            ]);

            this.loader.load();

            //child views
            this.noviceViews = [];
            this.proficientViews = [];
            this.expertViews = [];
            this.initChildViews();
        },

        initChildViews: function() {
            this.destroyChildViews();
            this.noviceViews = [];
            this.proficientViews = [];
            this.expertViews = [];

            this.collection.each(this.createSkillView, this);
        },

        render: function() {
            // Count the number of items in each expertise group
            var expertiseCounts = _.countBy(this.collection.models, function(skill) {
                return skill.get_expertise();
            });

            var context = {
                collection: this.collection.toJSON(),
                expertCount: expertiseCounts.Expert,
                proficientCount: expertiseCounts.Proficient,
                noviceCount: expertiseCounts.Novice
            };
            this.$el.html(this.template(context));

            _.each(this.noviceViews, function(view) {
                this.append(view, this.noviceSkillsSelector);
            }, this);

            _.each(this.proficientViews, function(view) {
                this.append(view, this.proficientSkillsSelector);
            }, this);

            _.each(this.expertViews, function(view) {
                this.append(view, this.expertSkillsSelector);
            }, this);

            // Activate tooltips
            // TODO remove on destroy. Apply tooltip to child view instead?
            this.$('[rel=tooltip]').tooltip();

            return this;
        },

        createSkillView: function(model) {
            var view = new UserSkillView({
                model: model
            });

            var compare = function(view1, view2) {
                return array.defaultCompare(
                        -view1.model.get_yrs_experience(),
                        -view2.model.get_yrs_experience());
            };

            switch(model.get_expertise()) {
                case 'Novice':
                    array.binaryInsert(this.noviceViews, view, compare);
                    break;
                case 'Proficient':
                    array.binaryInsert(this.proficientViews, view, compare);
                    break;
                case 'Expert':
                    array.binaryInsert(this.expertViews, view, compare);
                    break;
            }

            return view;
        },

        onReset: function() {
            this.initChildViews();
            this.render();
        },

        onAdd: function(model) {
            var view = this.createSkillView(model);
            this.render();
        }
    });

    /**
     * Talent user note view.
     * @constructor
     * @param {Object} options
     *   candidateModel: {User} (required)
     */
    var UserNoteView = view.View.extend({

        textareaSelector: '.user-note-input',
        saveStatusSelector: '.user-note-save-status',

        events: {
            'blur textarea': 'onBlur'
        },

        SaveStatusEnum: {
            PENDING : 'Saving note...',
            SAVED : 'Saved.',
            FAILED : 'Save failed. Please refresh the page and try again.'
        },

        initialize: function(options) {
            this.candidateModel = options.candidateModel;
            this.employeeModel = new api.User({id: 'CURRENT'});
            this.model = null;
            this.saveTimeout = null;
            this.saveStatus = null;
            // We enable this view for editing once we know the
            // existing note model has loaded, if it exists. This prevents
            // us from creating a new note and overwriting an existing note.
            this.template = _.template(note_template);

            // Clone the collection since we will be filtering it
            // TODO this.notesCollection = this.candidateModel.get_job_notes().clone();
            this.notesCollection = new api.JobNoteCollection();
            this.notesCollection.on('reset', this.onReset, this);

            // Since we retrieved all notes on the candidate, we need to
            // filter the collection down to just the employee's notes
            this.noteQuery = this.notesCollection.filterBy({
                employee_id: this.employeeModel.id,
                tenant_id: this.employeeModel.get_tenant_id()
            });
            this.noteQuery.fetch(); // invokes 'reset' on notes collection
        },

        destroy: function() {
            if (this.saveStatus === this.SaveStatusEnum.PENDING) {
                this._save();
            }
            view.View.prototype.destroy.apply(this, arguments);
        },

        render: function() {
            var context = {
                model: this.model ? this.model.toJSON() : null
            };
            this.$el.html(this.template(context));
            return this;
        },

        onReset: function() {
            // Load Note if it exists or create new Note
            if (this.notesCollection.length) {
                this.model = this.notesCollection.first();
                this.saveStatus = this.SaveStatusEnum.SAVED;
            } else {
                this.model = new api.JobNote({
                    employee_id: this.employeeModel.id,
                    candidate_id: this.candidateModel.id,
                    tenant_id: this.employeeModel.get_tenant_id()
                });
            }
            // Display the note
            this.render();
        },

        onBlur: function() {
            var currentNote = this.$(this.textareaSelector).val();
            var isNoteModified = true;

            // Don't save if the user hasn't previously saved a note and
            // the textarea is empty. This will prevent saving empty notes.
            if (this.saveStatus === null &&
                currentNote.length === 0) {
                isNoteModified = false;
            }

            // Don't save if current text is identical to previously saved text
            // Checking for a SAVED status here also ensures that this.model
            // will not be null when get_note() is invoked.
            if (this.saveStatus === this.SaveStatusEnum.SAVED &&
                this.model.get_note() === currentNote) {
                isNoteModified = false;
            }

            if (isNoteModified) {
                this._scheduleSave();
            }
        },

        /**
         * Update the save status in the UI
         */
        updateSaveStatusUI: function() {
            this.$(this.saveStatusSelector).text(this.saveStatus);
        },

        /**
         * Method to schedule saving the note in the future.
         * This method is required to prevent the user from
         * saving their note every second (or more), and triggering
         * a large number of writes on the db.
         * @private
         * @param secs Number of millisecs to delay until saving (optional)
         *        Default value is 500 milliseconds.
         */
        _scheduleSave: function(millisecs) {
            var delay = millisecs ? millisecs : 500; // 500 millisec default
            this.saveStatus = this.SaveStatusEnum.PENDING;
            this.updateSaveStatusUI();
            // clear any existing scheduled saves
            clearTimeout(this.saveTimeout);
            // Wrap the save function callback using JQuery's proxy() since
            // setTimeout doesn't support passing a context.
            this.saveTimeout = setTimeout($.proxy(this._save, this), delay);
        },

        /**
         * Save note.
         * @private
         */
        _save: function() {
            var that = this;
            var attributes = {
                employee_id: this.model.get_employee_id(),
                candidate_id: this.model.get_candidate_id(),
                tenant_id: this.model.get_tenant_id(),
                note: this.$(this.textareaSelector).val()
            };
            var isValid = this.model.validate(attributes);
            if (isValid === undefined) {
                // undefined implies the model attributes are valid
                this.model.save(attributes, {
                    wait: true,
                    success: function(model) {
                        that.saveStatus = that.SaveStatusEnum.SAVED;
                        that.updateSaveStatusUI();
                    },
                    error: function(model) {
                        that.saveStatus = that.SaveStatusEnum.FAILED;
                        that.updateSaveStatusUI();
                    }
                });
            } else {
                this.saveStatus = this.SaveStatusEnum.FAILED;
                this.updateSaveStatusUI();
            }
        }
    });

    /**
     * Application Vote Button View.
     * @constructor
     * @param {Object} options
     *    model: {Application} (required)
     */
    var VoteButtonsView = view.View.extend({

        buttonGroupSelector: '.btn-group button',

        events: {
            'click .active': 'onUnclick',
            'click button:not([class="active"])': 'onClick'
        },

        initialize: function(options) {
            this.applicationModel = options.applicationModel;
            this.employeeModel = new api.User({id: 'CURRENT'});
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
            this.appVoteQuery.fetch(); // invokes 'reset' on collection
        },

        render: function() {
            var context = {
                toggled: this.voteModel ? this.voteModel.get_yes() : null
            };
            this.$el.html(this.template(context));
            return this;
        },

        onReset: function() {
            // Load Score if it exists or create new one
            if (this.appVotesCollection.length) {
                this.voteModel = this.appVotesCollection.first();
            } else {
                this.voteModel = new api.ApplicationVote({
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
            this.triggerEvent(talent_events.CAST_APPLICANT_VOTE, eventBody);
        }
    });

    /**
     * Talent application brief view.
     * This view displays a brief version of an application.  It allows
     * employers to see/edit a candidate's score and vote for a specific
     * requisition.
     * @constructor
     * @param {Object} options
     *    model: {Application} (required)
     */
    var ApplicationBriefView = view.View.extend({

        ratingCommunicationSelector: '.rating-communication-container',
        ratingTechnicalSelector: '.rating-technical-container',
        ratingCultureSelector: '.rating-culture-container',
        voteButtonsSelector: '.vote-buttons-container',
        tooltipSelector: '[rel=tooltip]',

        events: {
            'change .rating-culture-container': 'onCulturalFitScoreChange',
            'change .rating-technical-container': 'onTechnicalScoreChange',
            'change .rating-communication-container': 'onCommunicationScoreChange'
        },

        childViews: function() {
            return [
                this.voteButtonsView,
                this.ratingCommunicationView,
                this.ratingTechnicalView,
                this.ratingCultureView
            ];
        },

        initialize: function(options) {
            this.model = options.model;
            this.listenTo(this.model, 'change', this.onAppModelChange);
            this.listenTo(this.model.get_requisition(), 'change', this.onReqModelChange);
            this.employeeModel = new api.User({id: 'CURRENT'});
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
            this.loader = new api_loader.ApiLoader([
                { instance: this.model, withRelated: ['requisition'] }
            ]);
            this.loader.load(); // invokes 'change' event on this.model when loaded

            // Since we retrieved all application scores on the application, we
            // need to filter the collection down to just this employee's score
            this.appScoreQuery = this.appScoresCollection.filterBy({
                user_id: this.employeeModel.id
            });
            this.appScoreQuery.fetch(); // invokes 'reset' on collection
        },

        initChildViews: function() {
            this.voteButtonsView = new VoteButtonsView({
                applicationModel: this.model
            });
            this.ratingCommunicationView = new ratingstars_views.RatingStarsView({
                label: 'Comm'
            });
            this.ratingTechnicalView = new ratingstars_views.RatingStarsView({
                label: 'Tech'
            });
            this.ratingCultureView = new ratingstars_views.RatingStarsView({
                label: 'Fit '
            });
        },

        destroy: function() {
            // Need to hide any tooltips since this view could be removed
            // from the DOM before a mouseleave() event fires
            this.$(this.tooltipSelector).tooltip('hide');
            view.View.prototype.destroy.apply(this, arguments);
        },

        render: function() {
            var requisitionTitle = this.model.get_requisition().get_title();
            var context = {
                model: this.model.toJSON(),
                req_name: requisitionTitle ? requisitionTitle : this.model.get_requisition_id()
            };
            this.$el.html(this.template(context));

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

            this.$(this.tooltipSelector).tooltip(); // Activate tooltips

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
                this.scoreModel = new api.ApplicationScore({
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
            this.triggerEvent(talent_events.SCORE_APPLICANT, eventBody);
        }
    });

    /**
     * Talent user requisition select view.
     * This view displays a list of requisitions. If the candidate already has
     * an application for a requisition, that requisition is not listed.
     * @constructor
     * @param {Object} options
     *    applicationsCollection: {ApplicationsCollection} (required)
     *      The candidate's applications.
     */
    var RequisitionSelectView = view.View.extend({

        autoSelectViewSelector: '.autoselectview',
        searchInputSelector: 'input.search',

        childViews: function() {
            return [
                this.autoSelectView
            ];
        },

        initialize: function(options) {
            var that = this;
            this.applicationsCollection = options.applicationsCollection;
            this.employeeModel = new api.User({id: 'CURRENT'});
            this.requisitionSelectionCollection = new select_models.SelectionCollection();
            this.template = _.template(requisition_select_template);

            // Create objects required to support Requisition autocomplete
            // This query is used to seed the results which will then be parsed
            // by the search string.
            this.requisitionsQueryFactory = function(options) {
                return new api.RequisitionCollection().filterBy({
                    'tenant_id__eq': that.employeeModel.get_tenant_id(),
                    'status__eq': 'OPEN',
                    'title__istartswith': options.search
                });
            };

            // This matcher is used to compare the results of the query with
            // the match criteria specified by the user.
            // The matcher methods do the following:
            //      stringify: convert model into searchable text string
            //      map: convert *matched* results
            this.requisitionsMatcher = new ac_matcher.QueryMatcher({
                queryFactory: new factory.FunctionFactory(this.requisitionsQueryFactory),
                stringify: function(model) {
                    return model.get_title();
                },
                map: function(model) {
                    var ret = null;
                    // To prevent using a crazy query, filter the
                    // results here again to only return requisitions
                    // that are not already included in the applications
                    // collection.
                    if (!that.applicationsCollection.where({requisition_id: model.id}).length) {
                        ret = {
                            id: model.id,
                            value: model.get_title()
                        };
                    }
                    return ret;
                }
            });

            // init child views
            this.autoSelectView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.autoSelectView = new select_views.AutoMultiSelectView({
                inputPlaceholder: 'Search requisition titles',
                collection: this.requisitionSelectionCollection,
                matcher: this.requisitionsMatcher,
                maxResults: 5
            });
        },

        render: function() {
            var context = {};
            this.$el.html(this.template(context));
            this.append(this.autoSelectView, this.autoSelectViewSelector);
            return this;
        }
    });


    /**
     * Talent user create applications view.
     * This view displays a list of requisitions and creates applications
     * for the selected items.  If the candidate already has an application for
     * a requisition, that requisition is not listed in this view.
     * @constructor
     * @param {Object} options
     *    applicationsCollection: {ApplicationsCollection} (required)
     *      The candidate's applications.
     *      candidateModel: {User} Represents the developer (required)
     */
    var ApplicationCreateView = view.View.extend({

        tooltipSelector: '[rel=tooltip]',

        events: {
            'click .drop-button': 'onToggle',
            'open .drop': 'onDropViewOpened',
            'close .drop': 'onDropViewClosed',
            'click .cancel': 'onClose',
            'click .save': 'onSave'
        },

        childViews: function() {
            return [
                this.dropView,
                this.selectView
            ];
        },

        initialize: function(options) {
            this.applicationsCollection = options.applicationsCollection;
            this.candidateModel = options.candidateModel;
            this.template = _.template(application_create_template);

            // init child views
            this.dropView = null;
            this.selectView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.selectView = new RequisitionSelectView({
                applicationsCollection: this.applicationsCollection
            });
            this.dropView = new drop_views.DropView({
                view: this.selectView
            });
        },

        destroy: function() {
            // Need to hide any tooltips since this view could be removed
            // from the DOM before a mouseleave() event fires
            this.$(this.tooltipSelector).tooltip('hide');
            view.View.prototype.destroy.apply(this, arguments);
        },

        render: function() {
            var context = {};
            this.$el.html(this.template(context));
            this.append(this.dropView);
            this.$(this.tooltipSelector).tooltip(); // Activate tooltips
            return this;
        },

        onToggle: function(e) {
            this.dropView.toggle();
        },

        onClose: function(e) {
            this.dropView.close();
        },

        onSave: function(e) {
            this.selectView.requisitionSelectionCollection.each(
                this._createApplication,
                this // context
            );
            this.dropView.close();
        },

        onDropViewOpened: function(e) {
            this.dropView.childView.autoSelectView.refresh();
            this.dropView.childView.autoSelectView.input().focus();
        },

        onDropViewClosed: function(e) {
            this.selectView.requisitionSelectionCollection.reset();
            this.$(this.selectView.searchInputSelector).val('');
        },

        /**
         * Create application
         * @param requisitionSelectionModel
         * @private
         */
        _createApplication: function(requisitionSelectionModel) {
            // Only create applications for the selected requisitions
            if (requisitionSelectionModel.selected()) {
                var that = this;
                var application = new api.Application({
                    user_id: this.candidateModel.id,
                    requisition_id: requisitionSelectionModel.id
                });
                var eventBody = {
                    model: application,
                    onSuccess: function() {
                        that.applicationsCollection.add(application);
                    }
                };
                this.triggerEvent(talent_events.CREATE_APPLICATION, eventBody);
            }
        }
    });

    /**
     * Talent user actions view.
     * This view displays views which allow employers to evaluate candidates.
     * @constructor
     * @param {Object} options
     *    candidateModel: {User} (required)
     */
    var UserActionsView = view.View.extend({

        noteSelector: '.user-note',
        applicationCreateSelector: '.application-create-container',
        applicationBriefsSelector: '.application-briefs',

        childViews: function() {
            return [
                this.noteView,
                this.applicationCreateView,
                this.applicationBriefsView
            ];
        },

        initialize: function(options) {
            this.candidateModel = options.candidateModel;
            this.employeeModel = new api.User({id: 'CURRENT'});
            this.template = _.template(actions_template);

            // load applications
            this.applicationsCollection = this.candidateModel.get_applications();
            // Since we retrieved all applications on the candidate, we need to
            // filter the collection down to just the employer's applications
            this.applicationsQuery = this.applicationsCollection.filterBy({
                tenant_id: this.employeeModel.get_tenant_id(),
                requisition__status: 'OPEN'
            });
            this.applicationsQuery.fetch(); // invokes 'reset' on collection

            //child views
            this.noteView = null;
            this.applicationCreateView = null;
            this.applicationBriefsView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.noteView = new UserNoteView({
                candidateModel: this.candidateModel
            });
            this.applicationCreateView = new ApplicationCreateView({
                applicationsCollection: this.applicationsCollection,
                candidateModel: this.candidateModel
            });
            this.applicationBriefsView = new collection_views.CollectionView({
                collection: this.applicationsCollection,
                viewFactory: new factory.Factory(ApplicationBriefView, {})
            });
        },

        render: function() {
            var context = {
                candidateModel: this.candidateModel
            };
            this.$el.html(this.template(context));
            this.append(this.noteView, this.noteSelector);
            this.append(this.applicationCreateView, this.applicationCreateSelector);
            this.append(this.applicationBriefsView, this.applicationBriefsSelector);
            return this;
        }
    });

    /**
     * Talent user view.
     * @constructor
     * @param {Object} options
     *   candidateModel: {User} Represents the developer (required)
     *   employeeModel: {User} Represents the employee (required)
     *   playerState: PlayerState model (required)
     */
    var UserView = view.View.extend({

        jobPrefsSelector: '#user-job-prefs',
        skillsSelector: '#user-skills',
        chatsSelector: '#user-chats',
        actionsSelector: '#user-actions',

        childViews: function() {
            return [
                this.jobPrefsView,
                this.skillsView,
                this.chatsView,
                this.actionsView
            ];
        },

        initialize: function(options) {
            this.candidateModel = options.candidateModel;
            this.employeeModel = options.employeeModel;
            this.playerState = options.playerState;
            this.template =  _.template(user_template);
            this.modelWithRelated = [
                'highlight_sessions__chat_session__chat__topic',
                'skills__technology',
                'position_prefs',
                'technology_prefs',
                'location_prefs'
            ];

            //bind events
            this.listenTo(this.candidateModel, 'change', this.render);

            this.loader = new api_loader.ApiLoader([
                { instance: this.candidateModel, withRelated: this.modelWithRelated }
            ]);
            this.loader.load();

            //child views
            this.jobPrefsView = null;
            this.skillsView = null;
            this.chatsView = null;
            this.actionsView = null;
            this.initChildViews();
        },

        initChildViews: function() {

            this.jobPrefsView = new UserJobPrefsView({
                model: this.candidateModel
            });

            this.skillsView = new UserSkillsView({
                collection: this.candidateModel.get_skills()
            });
            
            this.chatsView = new UserHighlightSessionsView({
                collection: this.candidateModel.get_highlight_sessions(),
                playerState: this.playerState
            });

            this.actionsView = new UserActionsView({
                candidateModel: this.candidateModel
            });
        },

        render: function() {
            var context = {
                model: this.candidateModel.toJSON(),
                fmt: this.fmt // date formatting
            };
            this.$el.html(this.template(context));

            this.assign(this.jobPrefsView, this.jobPrefsSelector);
            this.assign(this.skillsView, this.skillsSelector);
            this.assign(this.chatsView, this.chatsSelector);
            this.assign(this.actionsView, this.actionsSelector);
            return this;
        }

    });

    return {
        EVENTS: EVENTS,
        UserView: UserView
    };
});
