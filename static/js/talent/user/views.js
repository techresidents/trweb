define([
    'jquery',
    'underscore',
    'jquery.bootstrap',
    'core/view',
    'api/loader',
    'text!talent/user/templates/user.html',
    'text!talent/user/templates/jobprefs.html',
    'text!talent/user/templates/skills.html',
    'text!talent/user/templates/skills_filter.html',
    'text!talent/user/templates/skill.html',
    'text!talent/user/templates/chats.html',
    'text!talent/user/templates/chat.html'
], function(
    $,
    _,
    none,
    view,
    api_loader,
    user_template,
    jobprefs_template,
    skills_template,
    skills_filter_template,
    skill_template,
    chats_template,
    chat_template) {

    /**
     * User View Events
     */
    var EVENTS = {
        UPDATE_SKILLS_FILTER: 'user:updateSkillsFilter',
        PLAY_CHAT: 'user:playChat'
    };

    /**
     * Talent user job preferences view.
     * @constructor
     * @param {Object} options
     *   model: {User} (required)
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
            this.modelWithRelated = ['position_prefs', 'technology_prefs', 'location_prefs'];
            this.childViews = [];
            this.loader = new api_loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated }
            ]);

            this.loader.load({
                success: _.bind(this.render, this)
            });
        },

        render: function() {
            _.each(this.childViews, function(view) {
                view.destroy();
            });

            this.childViews = [];
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
            }
            else {
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
            this.playerState.bind('change:chatSession', this.render, this);
            this.playerState.bind('change:state', this.render, this);
            this.model.bind('change', this.render, this);
            this.modelWithRelated = ['chat__topic'];

            this.loader = new api_loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated }
            ]);

            this.loader.load({
                success: _.bind(this.render, this)
            });
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
            this.collection.bind('reset', this.render, this);
            this.collection.bind('add', this.added, this);
            this.collectionWithRelated = ['chat_session__chat__topic'];
            this.childViews = [];

            this.loader = new api_loader.ApiLoader([
                { instance: this.collection, withRelated: this.collectionWithRelated }
            ]);

            this.loader.load({
                success: _.bind(this.render, this)
            });
        },

        render: function() {
            _.each(this.childViews, function(view) {
                view.destroy();
            });

            this.childViews = [];
            var context = {
                collection: this.collection.toJSON({
                    withRelated: this.collectionWithRelated
                })
            };
            this.$el.html(this.template(context));

            this.collection.each(this.added, this);
            return this;
        },

        /**
         * Construct a view from the input model
         * and append to this View.
         * @param model ChatSession model
         */
        added: function(model) {
            var view = new UserChatSessionView({
                model: model.get_chat_session(),
                playerState: this.playerState
            }).render();

            this.childViews.push(view);
            this.$(this.chatSessionsSelector).append(view.el);
        }
    });

    /**
     * Talent user skills filter view.
     * @constructor
     * @param {Object} options
     *   filtersList: list of Technology types the user can filter by (required)
     */
    var UserSkillsFilterView = view.View.extend({

        filterSelector: '.user-skills-filter-container',

        events: {
            'change .user-skills-filter-container input:checkbox' : 'filterUpdated'
        },

        initialize: function(options) {
            this.template = _.template(skills_filter_template);
            this.filtersList = options.filtersList;
        },

        render: function() {
            var context = {
                filtersList: this.filtersList
            };
            this.$el.html(this.template(context));
            return this;
        },

        /**
         * Handle when user modifies the skills filter
         * @param e The DOM event
         */
        filterUpdated: function(e){
            var exclusionFilters = [];
            // get all disabled filters
            this.$(this.filterSelector + " input:checkbox:not(:checked)").each(function() {
                exclusionFilters.push($(this).val()); // here 'this' refers to the element returned by each()
            });
            var eventBody = {
                filters: exclusionFilters
            };
            this.triggerEvent(EVENTS.UPDATE_SKILLS_FILTER, eventBody);
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
            this.model.bind('change', this.render, this);
            this.modelWithRelated = ['technology'];
            
            this.loader = new api_loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated }
            ]);

            this.loader.load({
                success: _.bind(this.render, this)
            });
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

        initialize: function(options) {
            this.template =  _.template(skills_template);
            this.collection.bind('reset', this.render, this);
            this.collection.bind('add', this.added, this);
            this.collectionWithRelated = ['technology'];

            this.childViews = [];
            this.exclusionFilters = [];

            this.loader = new api_loader.ApiLoader([
                { instance: this.collection, withRelated: this.collectionWithRelated }
            ]);

            this.loader.load({
                success: _.bind(this.render, this)
            });
            
        },

        render: function() {
            _.each(this.childViews, function(view) {
                view.destroy();
            });

            this.childViews = [];

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

            // Sort skills such that skills with the most yrs experience
            // are first in the list.
            var sortedSkillsList = this.collection.sortBy(function(model) {
                return model.get_yrs_experience()*-1;
            }, this);

            // Add skills to DOM in order
            _.each(sortedSkillsList, this.added, this);

            // Apply any active filter settings
            this.filter(this.exclusionFilters);

            // Activate tooltips
            this.$('[rel=tooltip]').tooltip();

            return this;
        },

        /**
         * Create view for the input model
         * and append to the DOM
         * @param model Skill model
         */
        added: function(model) {

            var view = new UserSkillView({
                model: model
            }).render();
            this.childViews.push(view);

            // Append view to appropriate section of view based upon expertise level
            switch(model.get_expertise()) {
                case 'Novice':
                    this.$(this.noviceSkillsSelector).append(view.el);
                    break;
                case 'Proficient':
                    this.$(this.proficientSkillsSelector).append(view.el);
                    break;
                case 'Expert':
                    this.$(this.expertSkillsSelector).append(view.el);
                    break;
            }
        },

        /**
         * Show/Hide skill Views based upon filter options
         * @param exclusionFiltersList A list of filters to apply.
         * All views that match any of the input filters will be
         * hidden from view.
         */
        filter: function(exclusionFiltersList) {
            this.exclusionFilters = exclusionFiltersList;
            _.each(this.childViews, function(v) {
                    if (_.contains(this.exclusionFilters, v.model.get_technology().get_type())) {
                        v.$el.hide();
                    }
                    else {
                        v.$el.show();
                    }
                },
                this
            );
        }
    });

    /**
     * Talent user view.
     * @constructor
     * @param {Object} options
     *   model: {User} (required)
     *   playerState: PlayerState model (required)
     */
    var UserView = view.View.extend({

        jobPrefsSelector: '#user-job-prefs',

        skillsFilterSelector: '#user-skills-filter',

        skillsSelector: '#user-skills',

        chatsSelector: '#user-chats',

        events: {
            'user:updateSkillsFilter': 'onSkillsFilterUpdated'
        },

        childViews: function() {
            return [
                this.jobPrefsView,
                this.skillsFilterView,
                this.skillsView,
                this.chatsView];
        },

        initialize: function(options) {
            this.playerState = options.playerState;
            this.template =  _.template(user_template);
            this.model.bind('change', this.render, this);
            this.modelWithRelated = [
                'highlight_sessions__chat_session__chat__topic',
                'skills__technology',
                'position_prefs',
                'technology_prefs',
                'location_prefs'
            ];

            //child views
            this.jobPrefsView = null;
            this.skillsFilterView = null;
            this.skillsView = null;
            this.chatsView = null;

            this.loader = new api_loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated }
            ]);

            this.loader.load({
                success: _.bind(this.render, this)
            });

        },

        render: function() {
            var context = {
                model: this.model.toJSON(),
                fmt: this.fmt // date formatting
            };
            this.$el.html(this.template(context));

            this.jobPrefsView = new UserJobPrefsView({
                el: this.$(this.jobPrefsSelector),
                model: this.model
            }).render();

            // Create tuples for skills filters (displayName, dbValue)
            var languages = {displayName: 'Languages', value: 'Language'};
            var frameworks = {displayName: 'Frameworks', value: 'Framework'};
            var persistence = {displayName: 'Persistence', value: 'Persistence'};
            var filtersList = [languages, frameworks, persistence];

            this.skillsFilterView = new UserSkillsFilterView({
                el: this.$(this.skillsFilterSelector),
                filtersList: filtersList
            }).render();

            this.skillsView = new UserSkillsView({
                el: this.$(this.skillsSelector),
                collection: this.model.get_skills()
            }).render();
            
            this.chatsView = new UserHighlightSessionsView({
                el: this.$(this.chatsSelector),
                collection: this.model.get_highlight_sessions(),
                playerState: this.playerState
            }).render();

            return this;
        },

        /**
         * Handle when user updates their skills filter.
         * @param event The DOM event
         * @param eventBody Expecting the attribute 'filters' to be specified
         * which provides a list of the active exclusion filters
         */
        onSkillsFilterUpdated: function(event, eventBody) {
            this.skillsView.filter(eventBody.filters);
        }

    });

    return {
        EVENTS: EVENTS,
        UserView: UserView
    };
});
