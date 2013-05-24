define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'events',
    'ui',
    '../topic/views',
    'text!./templates/tlkpts_summary.html',
    'text!./templates/add_tlkpt.html',
    'text!./templates/talking_point.html',
    'text!./templates/topic_tlkpt_composite.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    events,
    ui,
    topic_views,
    tlkpts_summary_template,
    add_tlkpt_template,
    talking_point_template,
    topic_tlkpt_composite_template) {


    /**
     * AddTalkingPointView View
     * @constructor
     * @param {Object} options
     *   topic: {Topic} object (required)
     *   collection: {TalkingPointCollection} object (required)
     */
    var AddTalkingPointView = core.view.View.extend({

        events: {
            'click .add': 'onAdd'
        },

        initialize: function(options) {
            this.topic = options.topic;
            this.collection = options.collection;
            this.template =  _.template(add_tlkpt_template);
        },

        render: function() {
            this.$el.html(this.template());
            return this;
        },

        onAdd: function() {
            var userModel = new api.models.User({id: 'CURRENT'});
            var rank = 0;
            var highestRank = null;
            if (this.collection.length) {
                highestRank = this.collection.at(this.collection.length - 1).get_rank();
                rank = highestRank + 1;
            }
            var model = new api.models.TalkingPoint({
                user_id: userModel.id,
                topic_id: this.topic.id,
                rank: rank,
                point: null
            });
            this.collection.add(model);
        }
    });

    /**
     * TalkingPointListView View
     * @constructor
     * @param {Object} options
     *   collection: {TalkingPointCollection} object (required)
     *   modelRankAttribute: {String} name of rank attribute
     */
    var TalkingPointListView = ui.collection.views.OrderedListView.extend({

        initialize: function(options) {
            this.collection = options.collection;
            this.listenTo(this.collection, 'change:point change:rank', this.save);
            // Calling save on the collection after 'remove' event will
            // destroy the removed model.
            this.listenTo(this.collection, 'remove', this.save);
            ui.collection.views.OrderedListView.prototype.initialize.call(this, options);
        },

        save: function() {
            var eventBody = {
                collection: this.collection
            };
            this.triggerEvent(events.UPDATE_TALKING_POINTS, eventBody);
        }
    });

    /**
     * TalkingPointListItemView View
     * @constructor
     * @param {Object} options
     *   model: {TalkingPoint} object (required)
     */
    var TalkingPointListItemView = core.view.View.extend({

        inputSelector: '.talking-point-input',
        inputHookSelector: '.talking-point-input-hook',

        events: {
        },

        childViews: function() {
            return [this.inputHandlerView];
        },

        initialize: function(options) {
            this.template =  _.template(talking_point_template);

            // child views
            this.inputHandlerView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.inputHandlerView = new ui.input.views.InputHandlerView({
                model: this.model,
                modelAttribute: 'point',
                inputView: this,
                inputSelector: this.inputSelector,
                throttle: 1000
            });
        },

        render: function() {
            console.log('ItemView render');
            var context = {
                model: this.model
            };
            this.$el.html(this.template(context));
            this.append(this.inputHandlerView, this.inputHookSelector);
            return this;
        },

        delegateEvents: function() {
            // TODO
            //console.log('itemview delegate events');
            core.view.View.prototype.delegateEvents.apply(this, arguments);
            this.inputHandlerView.delegateEvents();
        },

        undelegateEvents: function() {
            // TODO
            //console.log('itemview undelegate events');
            this.inputHandlerView.undelegateEvents();
            core.view.View.prototype.undelegateEvents.apply(this, arguments);
        }
    });


    /**
     * TopicTalkingPointsCompositeView View
     * A TopicTalkingPointsCompositeView consists of one topic (no sub-topics) and
     * any associated talking points.
     * @constructor
     * @param {Object} options
     *   model: {Topic} object must have ID (required)
     */
    var TopicTalkingPointsCompositeView = core.view.View.extend({

        tlkptCompositeSelector: '.talking-point-composite-container',

        events: {
        },

        childViews: function() {
            return [
                this.topicView,
                this.addTalkingPointView,
                this.talkingPointsListView
            ];
        },

        initialize: function(options) {
            var userModel = new api.models.User({id: 'CURRENT'});
            this.model = options.model;
            this.modelWithRelated = ['talking_points'];
            this.collection = this.model.get_talking_points();
            this.collection.comparator = function(model) {
                return model.get_rank();
            };
            this.template =  _.template(topic_tlkpt_composite_template);

            // bind events
            // Only listening on 'loaded:read' so that render is called
            // after we invoke fetch(), and not whenever the collection
            // is saved.
            this.listenTo(this.collection, 'loaded:read', this.render);

            // load data
            // this.collection has all tlkpts for this topic. Now
            // we need to filter it down to just this user's tlkpts.
            this.collection.filterBy({user_id: userModel.id}).fetch();

            //child views
            this.topicView = null;
            this.addTalkingPointView = null;
            this.talkingPointsListView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.topicView = new topic_views.TopicView({
                model: this.model
            });
            this.addTalkingPointView = new AddTalkingPointView({
                topic: this.model,
                collection: this.collection
            });
            this.talkingPointsListView = new TalkingPointListView({
                collection: this.collection,
                modelRankAttribute: 'rank',
                sort: function (view) {
                    var ret = 0;
                    if (view && view.model) {
                        ret = view.model.get_rank();
                    }
                    return ret;
                },
                viewFactory: new core.factory.Factory(TalkingPointListItemView, {})
            });
        },

        render: function() {
            if (this.collection.isLoaded()) {
                console.log('TopicTalkingPoint render');
                var context = {
                    topic_level: this.model.get_level()
                };
                this.$el.html(this.template(context));
                this.append(this.topicView, this.tlkptCompositeSelector);
                this.append(this.talkingPointsListView, this.tlkptCompositeSelector);
                this.append(this.addTalkingPointView, this.tlkptCompositeSelector);
            }
            return this;
        }
    });

    /**
     * TalkingPointsSummaryView View
     * @constructor
     * @param {Object} options
     *   model: {Topic} Root topic model (required)
     */
    var TalkingPointsSummaryView = core.view.View.extend({

        chatWithFriendSelector: '#chat-with-friend-radio-btn',
        talkingPointsSelector: '.talking-points-view-hook',

        events: {
            'click .start-chat-btn': 'onStart'
        },

        childViews: function() {
            return [
                this.loaderView,
                this.talkingPointsView
            ];
        },

        initialize: function(options) {
            this.model = options.model;
            this.template =  _.template(tlkpts_summary_template);
            this.modelWithRelated = ['tree'];

            //load root topic and all sub-topic data
            this.loader = new api.loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated }
            ]);
            this.listenTo(this.loader, 'loaded', this.render);
            this.loader.load();

            //child views
            this.loaderView = null;
            this.talkingPointsView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.loaderView = new ui.load.views.LoaderView({
                loader: this.loader
            });
            this.talkingPointsView = new ui.collection.views.CollectionView({
                collection: this.model.get_tree(),
                viewFactory: new core.factory.Factory(TopicTalkingPointsCompositeView, {})
            });
        },

        render: function() {
            console.log('TlkPt Summary render');
            this.$el.html(this.template());
            if (this.loader.isLoaded()) {
                this.append(this.talkingPointsView, this.talkingPointsSelector);
            } else {
                this.append(this.loaderView);
            }
            return this;
        },

        onStart: function() {
            var that = this;
            var chatModel = null;
            var eventBody = null;
            var maxParticipants = 1;
            if (this.$(this.chatWithFriendSelector).is(":checked")) {
                maxParticipants = 2;
            }
            chatModel = new api.models.Chat({
                topic_id: this.model.id,
                max_participants: maxParticipants
            });
            eventBody = {
                model: chatModel,
                onSuccess: function(options, response) {
                    var navigateEvtBody = {
                        type: 'ChatView',
                        id: options.model.id
                    };
                    that.triggerEvent(events.VIEW_NAVIGATE, navigateEvtBody);
                }
            };
            this.triggerEvent(events.CREATE_CHAT, eventBody);
        }
    });

    return {
        AddTalkingPointView: AddTalkingPointView,
        TalkingPointListView: TalkingPointListView,
        TalkingPointListItemView: TalkingPointListItemView,
        TopicTalkingPointsCompositeView: TopicTalkingPointsCompositeView,
        TalkingPointsSummaryView: TalkingPointsSummaryView
    };
});
