define([
    'jquery',
    'underscore',
    'jquery.bootstrap',
    'core/view',
    'text!talent/user/templates/user.html',
    'text!talent/user/templates/jobprefs.html',
    'text!talent/user/templates/skills.html',
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

        events: {
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

            return this;
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
    };

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

        withRelated: ['technology'],

        beginnerSkillsSelector: '#beginner-skills',

        intermediateSkillsSelector: '#intermediate-skills',

        expertSkillsSelector: '#expert-skills',

        initialize: function(options) {
            this.template =  _.template(skills_template);
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

            //activate tooltips
            this.$('[rel=tooltip]').tooltip();

            return this;
        },

        added: function(model) {
            var view = new UserSkillView({
                model: model
            }).render();

            this.childViews.push(view);
            
            switch(model.get_expertise()) {
                case 'Beginner':
                    this.$(this.beginnerSkillsSelector).append(view.el);
                    this.addYrsXpStyle(model, this.beginnerSkillsSelector);
                    break;
                case 'Intermediate':
                    this.$(this.intermediateSkillsSelector).append(view.el);
                    this.addYrsXpStyle(model, this.intermediateSkillsSelector);
                    break;
                case 'Expert':
                    this.$(this.expertSkillsSelector).append(view.el);
                    this.addYrsXpStyle(model, this.expertSkillsSelector);
                    break;
            }
        },

        addYrsXpStyle: function(model, selector) {
            var yrs_xp = model.get_yrs_experience();
            if(yrs_xp <= 2){
                this.$(selector + ' div:last-child').addClass('user-skills-short-duration');
            }
            else if (yrs_xp > 2 && yrs_xp < 5){
                this.$(selector + ' div:last-child').addClass('user-skills-medium-duration');
            }
            else {
                this.$(selector + ' div:last-child').addClass('user-skills-long-duration');
            }
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

        skillsSelector: '#user-skills',

        chatsSelector: '#user-chats',

        events: {
        },

        childViews: function() {
            return [this.jobPrefsView, this.skillsView, this.chatsView];
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
            this.skillsView = null;
            this.chatsView = null;
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

            this.skillsView = new UserSkillsView({
                el: this.$(this.skillsSelector),
                collection: this.model.get_skills()
            }).render();

            this.chatsView = new UserChatSessionsView({
                el: this.$(this.chatsSelector),
                collection: this.model.get_chat_sessions()
            }).render();

            return this;
        }
    });

    return {
        EVENTS: EVENTS,
        UserView: UserView
    };
});
