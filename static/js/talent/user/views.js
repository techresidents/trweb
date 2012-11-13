define([
    'jquery',
    'underscore',
    'jquery.bootstrap',
    'core/view',
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
    user_template,
    jobprefs_template,
    skills_template,
    skills_filter_template,
    skill_template,
    chats_template,
    chat_template) {

    /**
     * Talent user job preferences view.
     * @constructor
     * @param {Object} options
     *   model: {User} (required)
     */
    var UserJobPrefsView = view.View.extend({

        expandableItemsSelector: '.expandable-list-items',
        slideToggleSelector: '.slide-toggle',
        positionPrefsSelector: '.position-prefs',
        locationPrefsSelector: '.location-prefs',
        technologyPrefsSelector: '.technology-prefs',

        events: {
            'click .position-prefs .slide-toggle' : 'togglePositionPrefs',
            'click .location-prefs .slide-toggle' : 'toggleLocationPrefs',
            'click .technology-prefs .slide-toggle' : 'toggleTechnologyPrefs'
        },

        togglePositionPrefs: function() {
            this.toggle(this.positionPrefsSelector);
        },

        toggleLocationPrefs: function() {
          this.toggle(this.locationPrefsSelector);
        },

        toggleTechnologyPrefs: function() {
            this.toggle(this.technologyPrefsSelector);
        },

        toggle: function(classSelector) {
            var itemsSelector = classSelector + ' ' + this.expandableItemsSelector;
            var sliderSelector = classSelector + ' ' + this.slideToggleSelector;
            this.$(itemsSelector).slideToggle(200, function() {
                if ($(sliderSelector).text() === 'more') {
                    $(sliderSelector).text('less');
                }
                else {
                    $(sliderSelector).text('more');
                }
            });
        },

        initialize: function(options) {
            this.template =  _.template(jobprefs_template);
            this.model.bind('loaded', this.loaded, this);
            this.childViews = [];

            if(!this.model.isLoading()) {
                this.load();
            }
        },

        loaded: function(instance) {
            //Cover case where model was already loading at time of view
            //creation, but not all necessary data was loaded. Invoking
            //load again will ensure all necessary data is loaded. If
            //all data is already loaded, this is a no-op.
            if(instance === this.model) {
                this.load();
            }
        },

        load: function() {
            var state = this.model.isLoadedWith(
                "position_prefs",
                "technology_prefs",
                "location_prefs");

            if(!state.loaded) {
                state.fetcher();
            }
        },

        render: function() {
            _.each(this.childViews, function(view) {
                view.destroy();
            });

            this.childViews = [];
            var context = {
                model: this.model.toJSON({withRelated: true}),
                fmt: this.fmt // date formatting
            };
            this.$el.html(this.template(context));

            // Add style to make lists expandable
            var expandableSections = [this.locationPrefsSelector, this.technologyPrefsSelector];
            _.each(expandableSections, this.addExpandableStyle, this);

            return this;
        },

        addExpandableStyle: function(classSelector) {
            this.$(classSelector).children('li').each(function(i) {
                // Always show the first 3 items; make the rest of the items expandable
                if (i > 2) {
                    $(this).addClass('expandable-list-items');
                    $(this).hide();
                }
            });
        }
    });

    /**
     * Talent user chat view.
     * @constructor
     * @param {Object} options
     *   model: ChatSession model (required)
     */
    var UserChatSessionView = view.View.extend({

        initialize: function(options) {
            this.template = _.template(chat_template);
            this.model.bind('loaded', this.loaded, this);
            this.model.bind('change', this.render, this);
            
            if(!this.model.isLoading()) {
                this.load();
            }
        },
        
        loaded: function(instance) {
            this.load();
        },
        
        load: function() {
            var state = this.model.isLoadedWith('chat__topic');
            if(!state.loaded) {
                state.fetcher();
            }
        },

        render: function() {
            var context = {
                model: this.model.toJSON({withRelated: true}),
                fmt: this.fmt
            };
            this.$el.html(this.template(context));
            return this;
        }
    });

    /**
     * Talent user chat sessions view.
     * @constructor
     * @param {Object} options
     *   collection: {ChatSessionCollection} (required)
     */
    var UserChatSessionsView = view.View.extend({

        events: {
        },

        chatSessionsSelector: '#chat-sessions',

        initialize: function(options) {
            this.template =  _.template(chats_template);
            this.collection.bind('loaded', this.loaded, this);
            this.collection.bind('reset', this.render, this);
            this.collection.bind('add', this.added, this);
            this.childViews = [];
            
            if(!this.collection.isLoading()) {
                this.load();
            }
        },

        loaded: function(instance) {
            if(instance === this.collection) {
                this.load();
            }
        },

        load: function() {
            var state = this.collection.isLoadedWith('chat__topic');
            if(!state.loaded) {
                state.fetcher();
            }
        },

        render: function() {
            _.each(this.childViews, function(view) {
                view.destroy();
            });

            this.childViews = [];
            var context = this.collection.toJSON({withRelated: true});
            this.$el.html(this.template(context));

            this.collection.each(this.added, this);
            return this;
        },

        added: function(model) {
            var view = new UserChatSessionView({
                model: model
            }).render();

            this.childViews.push(view);

            this.$(this.chatSessionsSelector).append(view.el);
        }
    });
    
    /**
     * User View Events
     */
    var EVENTS = {
        UPDATE_SKILLS_FILTER: 'user:updateSkillsFilter'
    };

    /**
     * Talent user skills filter view.
     * @constructor
     * @param {Object} options
     *   filtersList: list of Technology types the user can filter by (required)
     */
    var UserSkillsFilterView = view.View.extend({

        filterSelector: '.user-skills-filter',

        events: {
            'change .skills-filter input:checkbox' : 'filterUpdated'
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

        // TODO add doc
        filterUpdated: function(){
            var exclusionFilters = [];
            // get all disabled filters
            this.$(".skills-filter input:checkbox:not(:checked)").each(function() {
                exclusionFilters.push($(this).val()); // here 'this' refers to the element returned by each()
            });
            this.triggerEvent(EVENTS.UPDATE_SKILLS_FILTER, {filters: exclusionFilters});
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
            this.model.bind('loaded', this.loaded, this);

            if(!this.model.isLoading()) {
                this.load();
            }
        },

        loaded: function(instance) {
            //Cover case where model was already loading at time of view
            //creation, but not all necessary data was loaded. Invoking
            //load again will ensure all necessary data is loaded. If
            //all data is already loaded, this is a no-op.
            this.load();
        },

        load: function() {
            var state = this.model.isLoadedWith('technology');
            if(!state.loaded) {
                state.fetcher({
                    success: _.bind(this.render, this)
                });
            }
        },

        render: function() {
            var context = {
                model: this.model.toJSON({withRelated: true})
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

        beginnerSkillsSelector: '#beginner-skills',

        intermediateSkillsSelector: '#intermediate-skills',

        expertSkillsSelector: '#expert-skills',

        initialize: function(options) {
            this.template =  _.template(skills_template);
            this.collection.bind('loaded', this.loaded, this);
            this.collection.bind('reset', this.render, this);
            this.collection.bind('add', this.added, this);
            this.childViews = [];
            this.exclusionFilters = [];
            
            if(!this.collection.isLoading()) {
                this.load();
            }
        },

        loaded: function(instance) {
            if(instance === this.collection) {
                this.load();
            }
        },

        load: function() {
            var state = this.collection.isLoadedWith('technology');
            if(!state.loaded) {
                state.fetcher();
            }
        },

        render: function() {
            _.each(this.childViews, function(view) {
                view.destroy();
            });

            this.childViews = [];
            var context = this.collection.toJSON({withRelated: true});
            this.$el.html(this.template(context));

            // Sort skills such that skills with the most yrs experience
            // are first in the list.
            var sortedSkillsList = this.collection.sortBy(function(model) {
                return model.get_yrs_experience()*-1;
            }, this);
            _.each(sortedSkillsList, this.added, this);

            // apply filter settings
            this.filter(this.exclusionFilters);

            //activate tooltips
            this.$('[rel=tooltip]').tooltip();

            return this;
        },

        added: function(model) {

            var view = new UserSkillView({
                model: model
            }).render();
            this.childViews.push(view);

            // Append view to appropriate section of view based upon expertise level
            switch(model.get_expertise()) {
                case 'Beginner':
                    this.$(this.beginnerSkillsSelector).append(view.el);
                    break;
                case 'Intermediate':
                    this.$(this.intermediateSkillsSelector).append(view.el);
                    break;
                case 'Expert':
                    this.$(this.expertSkillsSelector).append(view.el);
                    break;
            }
        },

        filter: function(exclusionFiltersList) {
            this.exclusionFilters = exclusionFiltersList;
            _.each(this.childViews, function(v) {
                    // TODO why is type available without specifying it in isLoadedWith()?
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
     */
    var UserView = view.View.extend({

        jobPrefsSelector: '#user-job-prefs',

        skillsFilterSelector: '#user-skills-filter',

        skillsSelector: '#user-skills',

        chatsSelector: '#user-chats',

        events: {
        },

        childViews: function() {
            return [
                this.jobPrefsView,
                this.skillsFilterView,
                this.skillsView,
                this.chatsView];
        },

        initialize: function(options) {
            this.template =  _.template(user_template);
            this.model.bind('loaded', this.loaded, this);
            this.model.bind('change', this.render, this);

            if(!this.model.isLoading()) {
                this.load();
            }
            
            //child views
            this.jobPrefsView = null;
            this.skillsFilterView = null;
            this.skillsView = null;
            this.chatsView = null;

            // setup event listeners
            this.addEventListener(EVENTS.UPDATE_SKILLS_FILTER, this.onSkillsFilterUpdated, this);
        },

        load: function() {
            var state = this.model.isLoadedWith(
                "chat_sessions__chat__topic",
                "skills__technology",
                "position_prefs",
                "technology_prefs",
                "location_prefs");
            
            if(!state.loaded) {
                state.fetcher();
            } 
        },

        loaded: function() {
            //Cover case where model was already loading at time of view
            //creation, but not all necessary data was loaded. Invoking
            //load again will ensure all necessary data is loaded. If
            //all data is already loaded, this is a no-op.
            this.load();
        },

        render: function() {
            var context = {
                model: this.model.toJSON({withRelated: true}),
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

            this.chatsView = new UserChatSessionsView({
                el: this.$(this.chatsSelector),
                collection: this.model.get_chat_sessions()
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
