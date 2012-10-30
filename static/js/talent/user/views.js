define([
    'jquery',
    'underscore',
    'core/view',
    'text!talent/user/templates/user.html',
    'text!talent/user/templates/skills.html',
    'text!talent/user/templates/skill.html',
    'text!talent/user/templates/chats.html',
    'text!talent/user/templates/chat.html'
], function(
    $,
    _,
    view,
    user_template,
    skills_template,
    skill_template,
    chats_template,
    chat_template) {

    /**
     * Talent user chat view.
     * @constructor
     * @param {Object} options
     *   model: ChatSession model (required)
     */
    var UserChatSessionView = view.View.extend({

        initialize: function(options) {
            this.template = _.template(chat_template);
            this.model.bind('change', this.render, this);

            if(options.load) {
                this.model.withRelated("chat__topic").fetch();
            }
        },

        render: function() {
            var context = this.model.toJSON({withRelated: true});
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
            this.collection.bind('reset', this.render, this);
            this.collection.bind('add', this.added, this);
            this.childViews = [];

            if(options.load) {
                this.collection.withRelated("chat__topic").fetch();
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
                model: model,
                load: !model.isLoaded()
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

            if(options.load) {
                this.model.fetch();
            }
        },

        render: function() {
            var context = this.model.toJSON({withRelated: true});
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
            this.collection.bind('reset', this.render, this);
            this.collection.bind('add', this.added, this);
            this.childViews = [];

            if(options.load) {
                this.collection.withRelated("technology").fetch();
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
            var view = new UserSkillView({
                model: model,
                load: !model.isLoaded()
            }).render();

            this.childViews.push(view);
            
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
        }
    });

    /**
     * Talent user view.
     * @constructor
     * @param {Object} options
     *   model: {User} (required)
     */
    var UserView = view.View.extend({

        skillsSelector: '#user-skills',

        chatsSelector: '#user-chats',

        events: {
        },

        childViews: function() {
            return [this.skillsView, this.chatsView];
        },

        initialize: function(options) {
            this.template =  _.template(user_template);
            this.model.bind('change', this.render, this);

            if(options.load) {
                this.model.withRelated(
                    "chat_sessions__chat__topic",
                    "skills__technology",
                    "position_prefs",
                    "technology_prefs",
                    "location_prefs").fetch();
            }

            //child views
            this.skillsView = null;
        },

        render: function() {
            var context = this.model.toJSON({withRelated: true});
            this.$el.html(this.template(context));

            this.skillsView = new UserSkillsView({
                el: this.$(this.skillsSelector),
                collection: this.model.get_skills(),
                load: false
            }).render();

            this.chatsView = new UserChatSessionsView({
                el: this.$(this.chatsSelector),
                collection: this.model.get_chat_sessions(),
                load: false
            }).render();

            return this;
        }
    });

    return {
        EVENTS: EVENTS,
        UserView: UserView
    };
});
