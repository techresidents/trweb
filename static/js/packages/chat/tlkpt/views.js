define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'events',
    'ui',
    '../topic/views',
    'text!./templates/talking_points_summary.html',
    'text!./templates/add_tlkpt.html',
    'text!./templates/input_tlkpt.html',
    'text!./templates/tlkpt.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    events,
    ui,
    topic_views,
    talking_points_summary_template,
    add_talking_point_template,
    input_talking_point_template,
    talking_point_template) {


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
            this.template =  _.template(add_talking_point_template);
        },

        render: function() {
            var context = {
                level: this.topic.get_level()
            };
            this.$el.html(this.template(context));
            return this;
        },

        onAdd: function() {
            var userModel = new api.models.User({id: 'CURRENT'});
            var model = new api.models.TalkingPoint({
                user_id: userModel.id,
                topic_id: this.topic.id,
                rank: this.collection.length,
                point: ''
            });
            this.collection.add(model);
        }
    });

    /**
     * TalkingPointListView View
     * @constructor
     * @param {Object} options
     *   collection: {TalkingPointCollection} (required)
     *   modelRankAttribute: {String} name of rank attribute
     */
    var TalkingPointListView = ui.collection.views.OrderedListView.extend({

        initialize: function(options) {
            this.collection = options.collection;
            this.listenTo(this.collection, 'change', this.save);
            this.listenTo(this.collection, 'remove', this.onCollectionRemove);
            ui.collection.views.OrderedListView.prototype.initialize.call(this, options);
        },

        save: function() {
            var eventBody = {
                collection: this.collection
            };
            this.triggerEvent(events.UPDATE_TALKING_POINTS, eventBody);
        },

        onCollectionRemove: function() {
            // Calling save on the collection will destroy the removed model.
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
     *   topic: {Topic} object (required)
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
            this.topic = options.topic;
            this.template =  _.template(input_talking_point_template);

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
            console.log('itemView render');
            var context = {
                level: this.topic.get_level(),
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

    // TODO rename to TalkingPointTopicView.
    /**
     * TalkingPointView View
     * A TalkingPointView consists of one topic (no sub-topics) and
     * any associated talking points.
     * @constructor
     * @param {Object} options
     *   model: {Topic} object must have ID (required)
     */
    var TalkingPointView = core.view.View.extend({

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
            this.template =  _.template(talking_point_template);

            // bind events
            this.listenTo(this.collection, 'loaded', this.render);

            //load data
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
                viewFactory: new core.factory.Factory(TalkingPointListItemView, {
                    topic: this.model
                })
            });
        },

        render: function() {
            if (this.collection.isLoaded()) {
                this.$el.html(this.template());
                this.append(this.topicView);
                this.append(this.talkingPointsListView);
                this.append(this.addTalkingPointView);
            } else {
                // TODO add loader view
                console.log('%s render data not loaded yet', this.cid);
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

        events: {
        },

        talkingPointsSelector: '.talking-points-view-hook',

        childViews: function() {
            return [
                this.loaderView,
                this.talkingPointsView
            ];
        },

        initialize: function(options) {
            this.model = options.model;
            this.template =  _.template(talking_points_summary_template);
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
                viewFactory: new core.factory.Factory(TalkingPointView, {})
            });
        },

        render: function() {
            this.$el.html(this.template());
            if (this.loader.isLoaded()) {
                this.append(this.talkingPointsView, this.talkingPointsSelector);
            } else {
                this.append(this.loaderView);
            }
            return this;
        }
    });

    return {
        AddTalkingPointView: AddTalkingPointView,
        TalkingPointListView: TalkingPointListView,
        TalkingPointListItemView: TalkingPointListItemView,
        TalkingPointView: TalkingPointView,
        TalkingPointsSummaryView: TalkingPointsSummaryView
    };
});
