define([
    'jquery',
    'underscore',
    'core',
    'api',
    'ui',
    '../tlkpt/views',
    '../topic/views',
    '../topicpt/views',
    'text!./templates/playback.html',
    'text!./templates/talking_points.html',
    'text!./templates/participants.html',
    'text!./templates/participant.html'
], function(
    $,
    _,
    core,
    api,
    ui,
    tlkpt_views,
    topic_views,
    topicpt_views,
    playback_template,
    talking_points_template,
    participants_template,
    participant_template) {

    /**
     * Playback Participant View
     * @constructor
     * @param {Object} options
     * @param {User} options.model User model
     */
    var PlaybackParticipantView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.model = options.model;
            this.template = _.template(participant_template);
        },

        classes: function() {
            var result = ['playback-participant'];
            return result;
        },

        render: function() {
            var context = this.model.toJSON();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        }
    });

    /**
     * Playback Participants View
     * @constructor
     * @param {Object} options
     * @param {UserCollection} options.collection User collection
     */
    var PlaybackParticipantsView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.model = options.model;
            this.template = _.template(participants_template);

            //child views
            this.listView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.listView = new ui.collection.views.ListView({
                viewFactory: new core.factory.Factory(
                    PlaybackParticipantView, {}),
                collection: this.collection
            });
        },

        childViews: function() {
            return [this.listView];
        },

        classes: function() {
            return ['playback-participants'];
        },

        render: function() {
            this.$el.html(this.template());
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.listView);
            return this;
        }
    });

    /**
     * Playback Talking Points view.
     * @constructor
     * @param {Object} options
     * @param {TalkingPointCollection} options.collection
     *   Talking point collection
     * @param {User} options.model User model
     */
    var PlaybackTalkingPointsView = core.view.View.extend({
            
        events: {
            'click .minus': 'onMinusClick',
            'click .plus': 'onPlusClick'
        },

        initialize: function(options) {
            this.template =  _.template(talking_points_template);
            this.collection = options.collection;
            this.model = options.model;
            this.expanded = true;
            
            //bind events
            this.listenTo(this.collection, 'reset', this.render);

            //child views
            this.talkingPointsView = null;
            this.initChildViews();

        },

        childViews: function() {
            return [this.talkingPointsView];
        },

        initChildViews: function() {
            this.talkingPointsView = new tlkpt_views.TalkingPointCollectionView({
                collection: this.collection
            });
        },
        
        classes: function() {
            return ['playback-talking-points'];
        },

        render: function() {
            var context = {
                expanded: this.expanded,
                user: this.model.toJSON(),
                length: this.collection.length
            };
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.talkingPointsView, '.playback-talking-points-container');
            return this;
        },

        collapse: function() {
            if(this.expanded) {
                this.expanded = false;
                this.render();
            }
        },

        expand: function() {
            if(!this.expanded) {
                this.expanded = true;
                this.render();
            }
        },

        onMinusClick: function(e) {
            this.collapse();
        },

        onPlusClick: function(e) {
            this.expand();
        }
    });

    /**
     * Playback view.
     * @constructor
     * @param {Object} options
     * @param options.model Chat model
     */
    var PlaybackView = core.view.View.extend({
            
        events: {
        },

        initialize: function(options) {
            this.template =  _.template(playback_template);
            this.playerState = options.playerState;
            this.modelWithRelated = [
                'topic__tree',
                'users'
            ];
            
            //load data
            this.loader = new api.loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated }
            ]);
            this.loader.load();
            
            //child views
            this.topicPointsView = null;
            this.participantsView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [this.topicPointsView, this.participantsView];
        },


        initChildViews: function() {
            var topicViewFactory = new core.factory.Factory(
                    topic_views.PlayableTopicView, {
                        chat: this.model,
                        playerState: this.playerState
                    });
            var talkingPointsViewFactory = new core.factory.Factory(
                    PlaybackTalkingPointsView, {});

            this.topicPointsView = new ui.collection.views.CollectionView({
                collection: this.model.get_topic().get_tree(),
                viewFactory: new core.factory.Factory(
                    topicpt_views.TopicPointView, {
                        users: this.model.get_users(),
                        topicViewFactory: topicViewFactory,
                        talkingPointsViewFactory: talkingPointsViewFactory
                    })
            });

            this.participantsView = new PlaybackParticipantsView({
                collection: this.model.get_users()
            });
        },
        
        classes: function() {
            return ['playback'];
        },

        render: function() {
            var context = this.model.toJSON();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.topicPointsView, '.playback-topic-points-container');
            this.append(this.participantsView, '.playback-participants-container');
            return this;
        }
    });

    return {
        PlaybackView: PlaybackView
    };
});
