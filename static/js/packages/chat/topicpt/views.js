define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'ui',
    '../topic/views',
    '../tlkpt/views',
    'text!./templates/topic_point.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    ui,
    topic_views,
    tlkpt_views,
    topic_point_template) {
    
    var defaultTopicViewFactory = new core.factory.Factory(
        topic_views.TopicView, {});

    var defaultTalkingPointsViewFactory = new core.factory.Factory(
        tlkpt_views.TalkingPointCollectionView, {});

    /**
     * Topic Point View
     * @constructor
     * @param {object} options
     * @param {Topic} options.model Topic model
     * @param {factory} options.topicViewFactory
     * @param {factory} options.talkingPointsViewFactory
     * @param {UserCollection} options.users User collection
     */
    var TopicPointView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            options = _.extend({
                template: topic_point_template,
                topicViewFactory: defaultTopicViewFactory,
                talkingPointsViewFactory: defaultTalkingPointsViewFactory
            }, options);
        
            this.template = _.template(options.template);
            this.topicViewFactory = options.topicViewFactory;
            this.talkingPointsViewFactory = options.talkingPointsViewFactory;
            this.users = options.users;
            this.model = options.model;
            this.collection = this.model.get_talking_points();
            this.currentUser = new api.models.User({ id: 'CURRENT' });

            if(!this.users) {
                this.users = new api.models.UserCollection(
                        [this.currentUser]);
            }
            
            //child views
            this.topicView = null;
            this.talkingPointsView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.topicView = this.topicViewFactory.create({
                model: this.model
            });
            
            //for each user create a talking points view
            //using this.talkingPointsViewFactory.
            this.talkingPointsView = new ui.collection.views.CollectionView({
                collection: this.users,
                viewFactory: new core.factory.FunctionFactory(
                    _.bind(function(options) {
                        var user = options.model;

                        //talking points collection for user
                        var collection = this.model.get_talking_points();
                        collection.filterBy({
                            'user_id': user.id
                        }).fetch();
                        
                        //talking points view
                        return this.talkingPointsViewFactory.create({
                            collection: collection,
                            model: user
                        });
                    }, this))
            });
        },

        childViews: function() {
            return [this.topicView, this.talkingPointsView];
        },

        classes: function() {
            var result = ['topic-point'];
            result.push('level' + this.model.get_level());
            return result;
        },

        render: function() {
            var context = this.model.toJSON();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.topicView, '.topic-point-topic');
            this.append(this.talkingPointsView, '.topic-point-talking-points');
            return this;
        }
    });

    return {
        TopicPointView: TopicPointView
    };
});
