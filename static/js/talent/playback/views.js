define([
    'jquery',
    'jquery.bootstrap',
    'underscore',
    'core/view',
    'text!talent/playback/templates/minute.html',
    'text!talent/playback/templates/minutes.html',
    'text!talent/playback/templates/playback.html',
    'text!talent/playback/templates/tag.html',
    'text!talent/playback/templates/tags.html',
    'text!talent/playback/templates/user.html',
    'text!talent/playback/templates/users.html'
], function(
    $,
    none,
    _,
    view,
    minute_template,
    minutes_template,
    playback_template,
    tag_template,
    tags_template,
    user_template,
    users_template) {

    var EVENTS = {
        PLAY: 'playback:Play'
    };

    /**
     * Playback tag view.
     * @constructor
     * @param {Object} options
     *   model: {ChatTag} model (required)
     *   participant: {Number} (required)
     */
    var PlaybackTagView = view.View.extend({

        initialize: function(options) {
            this.template = _.template(tag_template);
            this.participant = options.participant;
            this.model.bind('change', this.render, this);
        },

        render: function() {
            var context = this.model.toJSON({withRelated: true});
            this.$el.html(this.template(context));
            this.$el.addClass('playback-tag');
            this.$el.addClass('participant' + this.participant);
            this.$('[rel=tooltip]').tooltip();
            return this;
        }
    });

    /**
     * Playback tags view.
     * @constructor
     * @param {Object} options
     *   collection: {ChatTagCollection} collection (required)
     *   users: {UserCollection} collection (required)
     */
    var PlaybackTagsView = view.View.extend({
        initialize: function(options) {
            this.template =  _.template(tags_template);
            this.users = options.users;
            this.collection.bind('reset', this.render, this);
            this.collection.bind('add', this.added, this);
            this.childViews = [];
        },

        render: function() {
            var context = {
                collection: this.collection.toJSON()
            };
            _.each(this.childViews, function(view) {
                view.destroy();
            });

            this.childViews = [];
            this.$el.html(this.template(context));
            this.collection.each(this.added, this);
                
            return this;
        },

        added: function(model) {
            var user = this.users.get(model.get_user_id());
            var view = new PlaybackTagView({
                model: model,
                participant: this.users.indexOf(user) + 1
            }).render();

            this.childViews.push(view);
            this.$el.append(view.el);
        }
    });

    /**
     * Playback user view.
     * @constructor
     * @param {Object} options
     *   model: User model (required)
     *   participant: {Number} (required)
     */
    var PlaybackUserView = view.View.extend({

        initialize: function(options) {
            this.template = _.template(user_template);
            this.participant = options.participant;
            this.model.bind('change', this.render, this);
        },

        render: function() {
            var context = this.model.toJSON({withRelated: true});
            this.$el.html(this.template(context));
            this.$el.addClass('playback-user');
            this.$el.addClass('participant' + this.participant);
            return this;
        }
    });

    /**
     * Playback users view.
     * @constructor
     * @param {Object} options
     *   collection: {UserCollection} collection (required)
     */
    var PlaybackUsersView = view.View.extend({
        initialize: function(options) {
            this.template =  _.template(users_template);
            this.collection.bind('reset', this.render, this);
            this.collection.bind('add', this.added, this);
            this.childViews = [];
        },

        render: function() {
            _.each(this.childViews, function(view) {
                view.destroy();
            });

            this.childViews = [];
            this.$el.html(this.template());
            this.collection.each(this.added, this);
                
            return this;
        },

        added: function(model) {
            var view = new PlaybackUserView({
                model: model,
                participant: this.collection.indexOf(model) + 1
            }).render();

            this.childViews.push(view);
            this.$el.append(view.el);
        }
    });

    /**
     * Playback minute view.
     * @constructor
     * @param {Object} options
     *   model: {ChatMinute} model (required)
     *   playerState: {PlayerState} model (required)
     */
    var PlaybackMinuteView = view.View.extend({

        events: {
            'click .play': 'play'
        },

        initialize: function(options) {
            this.template = _.template(minute_template);
            this.playerState = options.playerState;
            this.model.bind('change', this.render, this);
            this.playerState.bind('change', this.render, this);
        },

        isPlaying: function() {
            var result = false;
            var minute = this.playerState.chatMinute();
            if(minute && minute.id === this.model.id) {
                result = this.playerState.state() === this.playerState.STATE.PLAYING;
            }
            return result;
        },

        render: function() {
            var context = {
                minute: this.model.toJSON({withRelated: true}),
                playing: this.isPlaying(),
                fmt: this.fmt
            };
            context.minute.duration = new Date(this.model.get_end() - this.model.get_start());

            this.$el.html(this.template(context));
            this.$el.addClass('playback-minute');
            this.$el.addClass('level' + this.model.get_topic().get_level());
            return this;
        },

        play: function(e) {
            var eventBody = {
                chatSession: this.model.get_chat_session(),
                chatMinute: this.model
            };
            this.triggerEvent(EVENTS.PLAY, eventBody);
        }

    });

    /**
     * Playback minutes view.
     * @constructor
     * @param {Object} options
     *   model: {UserCollection} collection (required)
     *   playerState: {PlayerState} model (required)
     */
    var PlaybackMinutesView = view.View.extend({
        initialize: function(options) {
            this.template =  _.template(minutes_template);
            this.playerState = options.playerState;
            this.collection.bind('reset', this.render, this);
            this.collection.bind('add', this.added, this);
            this.childViews = [];
        },

        render: function() {
            _.each(this.childViews, function(view) {
                view.destroy();
            });

            this.childViews = [];
            this.$el.html(this.template());
            this.collection.each(this.added, this);
                
            return this;
        },

        added: function(model) {
            var view = new PlaybackMinuteView({
                model: model,
                playerState: this.playerState
            }).render();

            this.childViews.push(view);
            this.$el.append(view.el);
        }
    });


    /**
     * Playback view.
     * @constructor
     * @param {Object} options
     *   model: {ChaSession} model (required)
     *   playerState: {PlayerState} model (required)
     */
    var PlaybackView = view.View.extend({
            
        events: {
            'playback:Play': 'play'
        },

        childViews: function() {
            return [this.minutesView, this.usersView, this.tagsView];
        },

        initialize: function(options) {
            this.template =  _.template(playback_template);
            this.playerState = options.playerState;
            this.model.bind('loaded', this.loaded, this);
            this.model.bind('change', this.render, this);
            this.minutesView = null;
            this.usersView = null;
            this.tagsView = null;
            
            if(!this.model.isLoading()) {
                this.load();
            }
        },
        
        loaded: function(instance) {
            this.load();
        },

        load: function() {
            var state = this.model.isLoadedWith('chat__topic__tree', 'chat_minutes', 'users', 'chat_tags');
            if(!state.loaded) {
                state.fetcher();
            } else {
                //Manually set ChatMinute topic models.
                //This is an optimization, since we've already fetched the topic tree,
                //there's no need to fetch chat_minutes__topic.
                this.model.get_chat_minutes().each(function(minute) {
                    var topicId = minute.get_topic_id();
                    var topicTree = this.model.get_chat().get_topic().get_tree();
                    minute.set_topic(topicTree.get(topicId));
                }, this);


                //Manually set ChatTag minute models.
                //This is an optimization, similar to above.
                this.model.get_chat_tags().each(function(tag) {
                    var minutes = this.model.get_chat_minutes();
                    var minute = minutes.get(tag.get_chat_minute_id());
                    tag.set_chat_minute(minute);
                }, this);

                //Call render explicitly since we're swapping out models manually.
                this.render();
            }
        },

        render: function() {
            var context = this.model.toJSON({withRelated: true});
            this.$el.html(this.template(context));

            this.minutesView = new PlaybackMinutesView({
                el: this.$('.playback-minutes'),
                collection: this.model.get_chat_minutes(),
                playerState: this.playerState
            }).render();

            this.usersView = new PlaybackUsersView({
                el: this.$('.playback-users'),
                collection: this.model.get_users()
            }).render();

            this.tagsView = new PlaybackTagsView({
                el: this.$('.playback-tags'),
                collection: this.model.get_chat_tags(),
                users: this.model.get_users()
            }).render();

            return this;
        },

        play: function(e, eventBody) {
            //fill in chatSession model and let event propagate.
            eventBody.chatSession = this.model;
        }
    });

    return {
        EVENTS: EVENTS,
        PlaybackView: PlaybackView
    };
});
