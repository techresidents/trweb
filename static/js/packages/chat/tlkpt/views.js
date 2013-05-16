define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'ui',
    '../topic/views',
    'text!./templates/talking_points_summary.html',
    'text!./templates/add_tlkpt.html',
    'text!./templates/tlkpt.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    ui,
    topic_views,
    talking_points_summary_template,
    add_talking_point_template,
    talking_point_template) {


    /**
     * AddTalkingPointView View
     * @constructor
     * @param {Object} options
     *   topicLevel: {Number} topic level
     */
    var AddTalkingPointView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.topicLevel = options.topicLevel;
            this.template =  _.template(add_talking_point_template);
        },

        render: function() {
            var context = {
                level: this.topicLevel
            };
            this.$el.html(this.template(context));
            return this;
        }
    });

    /**
     * TalkingPointView View
     * A TalkingPointView consists of one topic (no sub-topics) and
     * any associated talking points.
     * @constructor
     * @param {Object} options
     *   model: {Topic} model (required)
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
            this.model = options.model;
            this.template =  _.template(talking_point_template);

            //load data
            // for the topic, load this user's talking points
            this.tpCollection = null;

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
                topicLevel: this.model.get_level()
            });
//            this.talkingPointsListView = new ui.collection.views.CollectionView({
//                collection: this.tpCollection,
//                viewFactory: new core.factory.Factory(TalkingPointInputView, {})
//            });
        },

        render: function() {
            this.$el.html(this.template());
            this.append(this.topicView);
            this.append(this.addTalkingPointView);
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
        TalkingPointView: TalkingPointView,
        TalkingPointsSummaryView: TalkingPointsSummaryView
    };
});
