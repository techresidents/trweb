define([
    'jquery',
    'jquery.bootstrap',
    'underscore',
    'core',
    'api',
    'text!./templates/minute.html',
    'text!./templates/minutes.html',
    'text!./templates/playback.html',
    'text!./templates/tag.html',
    'text!./templates/tags.html',
    'text!./templates/user.html',
    'text!./templates/users.html'
], function(
    $,
    none,
    _,
    core,
    api,
    minute_template,
    minutes_template,
    playback_template,
    tag_template,
    tags_template,
    user_template,
    users_template) {

    var EVENTS = {
        PLAY: 'playback:Play',
        PAUSE: 'playback:Pause'
    };

    /**
     * Playback tag view.
     * @constructor
     * @param {Object} options
     *   model: {ChatTag} model (required)
     *   participant: {Number} (required)
     */
    var PlaybackTagView = core.view.View.extend({

        initialize: function(options) {
            this.template = _.template(tag_template);
            this.participant = options.participant;

            //bind events
            this.listenTo(this.model, 'change', this.render);
        },

        render: function() {
            var context = this.model.toJSON({
                withRelated: ['chat_minute__topic']
            });
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
    var PlaybackTagsView = core.view.View.extend({
        initialize: function(options) {
            this.template =  _.template(tags_template);
            this.users = options.users;

            // bind events
            this.listenTo(this.collection, 'reset', this.onReset);
            this.listenTo(this.collection, 'add', this.onAdd);

            //child views
            this.childViews = [];
            this.initChildViews();
        },

        initChildViews: function() {
            this.destroyChildViews();
            this.childViews = [];
            this.collection.each(this.createChildView, this);
        },

        createChildView: function(model) {
            var user = this.users.get(model.get_user_id());
            var view = new PlaybackTagView({
                model: model,
                participant: this.users.indexOf(user) + 1
            }).render();
            this.childViews.push(view);
            return view;
        },

        render: function() {
            var context = {
                collection: this.collection.toJSON()
            };
            this.$el.html(this.template(context));

            _.each(this.childViews, function(view) {
                this.append(view);
            }, this);
            return this;
        },

        onReset: function() {
            this.initChildViews();
            this.render();
        },

        onAdd: function(model) {
            var view = this.createChildView(model);
            this.append(view);
        }
    });

    /**
     * Playback user view.
     * @constructor
     * @param {Object} options
     *   model: User model (required)
     *   participant: {Number} (required)
     */
    var PlaybackUserView = core.view.View.extend({

        initialize: function(options) {
            this.template = _.template(user_template);
            this.participant = options.participant;

            //bind events
            this.listenTo(this.model, 'change', this.render);
        },

        render: function() {
            var context = this.model.toJSON();
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
    var PlaybackUsersView = core.view.View.extend({
        initialize: function(options) {
            this.template =  _.template(users_template);

            //bind events
            this.listenTo(this.collection, 'reset', this.onReset);
            this.listenTo(this.collection, 'add', this.onAdd);

            //child views
            this.childViews = [];
            this.initChildViews();
        },

        initChildViews: function() {
            this.destroyChildViews();
            this.childViews = [];
            this.collection.each(this.createChildView, this);
        },

        createChildView: function(model) {
            var view = new PlaybackUserView({
                model: model,
                participant: this.collection.indexOf(model) + 1
            }).render();
            this.childViews.push(view);
            return view;
        },

        render: function() {
            this.$el.html(this.template());
            _.each(this.childViews, function(view) {
                this.append(view);
            }, this);
            return this;
        },

        onReset: function() {
            this.initChildViews();
            this.render();
        },

        onAdd: function(model) {
            var view = this.createChildView(model);
            this.append(view);
        }

    });

    /**
     * Playback minute view.
     * @constructor
     * @param {Object} options
     *   model: {ChatMinute} model (required)
     *   playerState: {PlayerState} model (required)
     */
    var PlaybackMinuteView = core.view.View.extend({

        events: {
            'click .play': 'play',
            'click .pause': 'pause'
        },

        initialize: function(options) {
            this.template = _.template(minute_template);
            this.playerState = options.playerState;

            //bind events
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.playerState, 'change:chatMinute', this.render);
            this.listenTo(this.playerState, 'change:state', this.render);
        },

        isPlaying: function() {
            var result = false;
            var minute = this.playerState.chatMinute();
            if(minute && minute.id === this.model.id) {
                result = this.playerState.isPlaying();
            }
            return result;
        },

        render: function() {
            var context = {
                minute: this.model.toJSON({
                    withRelated: ['topic']
                }),
                playing: this.isPlaying(),
                fmt: this.fmt
            };
            context.minute.duration = (this.model.get_end() - this.model.get_start()) / 1000;

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
        },

        pause: function(e) {
            this.triggerEvent(EVENTS.PAUSE);
        }

    });

    /**
     * Playback minutes view.
     * @constructor
     * @param {Object} options
     *   model: {UserCollection} collection (required)
     *   playerState: {PlayerState} model (required)
     */
    var PlaybackMinutesView = core.view.View.extend({
        initialize: function(options) {
            this.template =  _.template(minutes_template);
            this.playerState = options.playerState;

            //bind events
            this.listenTo(this.collection, 'reset', this.onReset);
            this.listenTo(this.collection, 'add', this.onAdd);

            //child views
            this.childViews = [];
            this.initChildViews();
        },

        initChildViews: function() {
            this.destroyChildViews();
            this.childViews = [];
            this.collection.each(this.createChildView, this);
        },

        createChildView: function(model) {
            var view = new PlaybackMinuteView({
                model: model,
                playerState: this.playerState
            }).render();
            this.childViews.push(view);
            return view;
        },

        render: function() {
            this.$el.html(this.template());
            _.each(this.childViews, function(view) {
                this.append(view);
            }, this);
            return this;
        },

        onReset: function() {
            this.initChildViews();
            this.render();
        },

        onAdd: function(model) {
            var view = this.createChildView(model);
            this.append(view);
        }
    });


    /**
     * Playback view.
     * @constructor
     * @param {Object} options
     *   model: {ChaSession} model (required)
     *   playerState: {PlayerState} model (required)
     */
    var PlaybackView = core.view.View.extend({
            
        events: {
            'playback:Play': 'play'
        },

        childViews: function() {
            return [this.minutesView, this.usersView, this.tagsView];
        },

        initialize: function(options) {
            this.template =  _.template(playback_template);
            this.playerState = options.playerState;
            this.modelWithRelated = [
                'chat__topic__tree',
                'chat_minutes',
                'users',
                'chat_tags'
            ];
            
            //bind events
            this.listenTo(this.model, 'change', this.render);
            
            //load data
            this.loader = new api.loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated }
            ]);
            this.loader.load();
            
            //child views
            this.minutesView = null;
            this.usersView = null;
            this.tagsView = null;
            this.initChildViews();

        },

        initChildViews: function() {
            this.minutesView = new PlaybackMinutesView({
                collection: this.model.get_chat_minutes(),
                playerState: this.playerState
            });

            this.usersView = new PlaybackUsersView({
                collection: this.model.get_users()
            });

            this.tagsView = new PlaybackTagsView({
                collection: this.model.get_chat_tags(),
                users: this.model.get_users()
            });
        },
        
        render: function() {
            var context = this.model.toJSON();
            this.$el.html(this.template(context));
            this.assign(this.minutesView, '.playback-minutes');
            this.assign(this.usersView, '.playback-users');
            this.assign(this.tagsView, '.playback-tags');
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
