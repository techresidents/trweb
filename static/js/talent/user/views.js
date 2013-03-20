define([
    'jquery',
    'underscore',
    'jquery.bootstrap',
    'core/array',
    'core/factory',
    'core/view',
    'api/loader',
    'api/models',
    'ratingstars/views',
    'ui/collection/views',
    'text!talent/user/templates/user.html',
    'text!talent/user/templates/jobprefs.html',
    'text!talent/user/templates/skills.html',
    'text!talent/user/templates/skill.html',
    'text!talent/user/templates/chats.html',
    'text!talent/user/templates/chat.html',
    'text!talent/user/templates/actions.html',
    'text!talent/user/templates/note.html',
    'text!talent/user/templates/applicationbrief.html',
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
    collection_views,
    user_template,
    jobprefs_template,
    skills_template,
    skill_template,
    chats_template,
    chat_template,
    actions_template,
    note_template,
    applicationbrief_template,
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
                successOnAlreadyLoaded: true
            });
            
            this.loader.load({
                success: _.bind(this.render, this)
            });
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
     *   employeeModel: {User} (required)
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

        /**
         * Method to schedule saving the note in the future.
         * This method is required to prevent the user from
         * saving their note every second (or more), and triggering
         * a large number of writes on the db.
         * @private
         * @param secs Number of secs to delay until saving (optional)
         *        Default value is 5 seconds.
         */
        _scheduleSave: function(secs) {
            var delay = secs ? secs*1000 : 5000; // 5 sec default
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
        },

        initialize: function(options) {
            this.candidateModel = options.candidateModel;
            this.employeeModel = options.employeeModel;
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
            // Don't save if the user hasn't previously saved a note and
            // the textarea is empty. This will prevent saving empty notes.
            if (this.saveStatus === null &&
                this.$(this.textareaSelector).val().length === 0) {
                // no-op
            } else {
                this._scheduleSave();
            }
        },

        /**
         * Update the save status in the UI
         */
        updateSaveStatusUI: function() {
            this.$(this.saveStatusSelector).text(this.saveStatus);
        }
    });

    /**
     * Application Vote Button View.
     * @constructor
     * @param {Object} options
     *   candidateModel: {User} (required)
     *   employeeModel: {User} (required)
     */
    var VoteButtonsView = view.View.extend({

        buttonGroupSelector: '.btn-group button',

        events: {
            'click .active': 'onUnclick',
            'click button:not([class="active"])': 'onClick'
        },

        /**
         * Save
         * @param e
         * @private
         */
        _save: function(e) {
            var voteValue = null;
            // Determine which button is set
            var target = this.$(e.target);
            if (target.hasClass('active') && target.hasClass('yes-vote')) {
                voteValue = true;
            }
            else if (target.hasClass('active') && target.hasClass('no-vote')) {
                voteValue = false;
            }
            // TODO this.model.save(voteValue)
        },

        initialize: function() {
            // TODO load model and toggle vote button
            this.model = null;
            this.template = _.template(vote_buttons_template);
        },

        render: function() {
            this.$el.html(this.template());
            return this;
        },

        onClick: function(e) {
            this.select(e);
            this.addButtonColor(e);
            this._save(e);
        },

        onUnclick: function(e) {
            this.deselect(e);
            this._save(e);
        },

        addButtonColor: function(e) {
            // Only set button color if button wasn't already active
            var target = this.$(e.target);
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

        select: function(e) {
            // Append the class 'active' to the element so we know when
            // saving which button is toggled.  If we didn't do this, then
            // bootstrap would add this class after our handlers finished.
            // Doing this will hopefully prevent any state-related bugs.
            var target = this.$(e.target);
            if (!target.hasClass('active')) {
                target.addClass('active');
            }
        },

        deselect: function(e) {
            var target = this.$(e.target);
            if (target.hasClass('active')) {
                // Stop event propogation to prevent bootstrap from
                // adding the class 'active' to the button downstream.
                e.stopImmediatePropagation();
                // Remove any button colors
                this.$(this.buttonGroupSelector).removeClass('btn-success btn-danger');
                // Deselect button
                target.removeClass('active');
            }
        }
    });

    /**
     * Talent application brief view.
     * @constructor
     * @param {Object} options
     *    candidateModel: {User} (required)
     *    employeeModel: {User} (required)
     */
    var ApplicationBriefView = view.View.extend({

        ratingCommunicationSelector: '.rating-communication-container',
        ratingTechnicalSelector: '.rating-technical-container',
        ratingCultureSelector: '.rating-culture-container',
        voteButtonsSelector: '.vote-buttons-container',

        childViews: function() {
            return [
                this.voteButtonsView,
                this.ratingCommunicationView,
                this.ratingTechnicalView,
                this.ratingCultureView
            ];
        },

        initialize: function(options) {
            this.template = _.template(applicationbrief_template);

            //child views
            this.voteButtonsView = null;
            this.ratingCommunicationView = null;
            this.ratingTechnicalView = null;
            this.ratingCultureView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.voteButtonsView = new VoteButtonsView();
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

        render: function() {
            var context = {
            };
            this.$el.html(this.template(context));
            this.assign(this.voteButtonsView, this.voteButtonsSelector);
            this.assign(this.ratingCommunicationView, this.ratingCommunicationSelector);
            this.assign(this.ratingTechnicalView, this.ratingTechnicalSelector);
            this.assign(this.ratingCultureView, this.ratingCultureSelector);
            return this;
        }
    });

    /**
     * Talent user actions view.
     * @constructor
     * @param {Object} options
     *    candidateModel: {User} (required)
     *    employeeModel: {User} (required)
     */
    var UserActionsView = view.View.extend({

        noteSelector: '.user-note',
        applicationBriefsSelector: '.application-briefs',

        childViews: function() {
            return [
                this.noteView,
                this.applicationBriefsView
            ];
        },

        initialize: function(options) {
            this.candidateModel = options.candidateModel;
            this.employeeModel = options.employeeModel;
            this.template = _.template(actions_template);

            //child views
            this.noteView = null;
            this.applicationBriefsView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.noteView = new UserNoteView({
                candidateModel: this.candidateModel,
                employeeModel: this.employeeModel
            });
//            this.applicationBriefsView = new collection_views.CollectionView({
//                collection: [],
//                viewFactory: new factory.Factory(ApplicationBriefView, {})
//            });
            this.applicationBriefsView = new ApplicationBriefView({});
        },

        render: function() {
            var context = {
                candidateModel: this.candidateModel
            };
            this.$el.html(this.template(context));
            this.append(this.noteView, this.noteSelector);
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
                candidateModel: this.candidateModel,
                employeeModel: this.employeeModel
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
