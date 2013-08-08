define([
    'jquery',
    'underscore',
    'core',
    'api',
    'ui',
    '../pref/views',
    '../skill/views',
    '../chat/views',
    '../action/views',
    'text!./templates/user.html'
], function(
    $,
    _,
    core,
    api,
    ui,
    pref_views,
    skill_views,
    chat_views,
    action_views,
    user_template) {

    var UserView = core.view.View.extend({

        /**
         * User view.
         * @constructs
         * @param {Object} options
         * @param {User} options.model User model
         * @param {PlayerState} options.playerState Player state model
         */
        initialize: function(options) {
            this.model = options.model;
            this.playerState = options.playerState;
            this.template =  _.template(user_template);
            this.modelWithRelated = [
                'chat_reels__chat__topic',
                'skills__technology',
                'position_prefs',
                'technologies',
                'locations'
            ];

            this.loader = new api.loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated }
            ]);

            //bind events
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.loader, 'loaded', this.render);

            //load data
            this.loader.load();

            //child views
            this.jobPrefsView = null;
            this.skillsView = null;
            this.chatsView = null;
            this.actionsView = null;
            this.initChildViews();
        },

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

        initChildViews: function() {

            this.jobPrefsView = new pref_views.UserJobPrefsView({
                model: this.model
            });

            this.skillsView = new skill_views.UserSkillsView({
                collection: this.model.get_skills()
            });
            
            this.chatsView = new chat_views.UserChatReelsView({
                collection: this.model.get_chat_reels(),
                playerState: this.playerState
            });

            this.actionsView = new action_views.UserActionsView({
                model: this.model
            });
        },

        render: function() {
            var context = {
                model: this.model.toJSON(),
                fmt: this.fmt // date formatting
            };

            if(this.loader.isLoaded()) {
                this.$el.html(this.template(context));

                this.assign(this.jobPrefsView, this.jobPrefsSelector);
                this.assign(this.skillsView, this.skillsSelector);
                this.assign(this.chatsView, this.chatsSelector);
                this.assign(this.actionsView, this.actionsSelector);
            }
            return this;
        }

    });

    return {
        UserView: UserView
    };
});
