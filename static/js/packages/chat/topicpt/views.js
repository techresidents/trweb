define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    '../topic/views',
    '../tlkpt/views',
    'text!./templates/topic_point.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
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
     * @param {factory} options.topicViewFactory
     * @param {factory} options.talkingPointsViewFactory
     * @param {array} options.userIds
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
            this.userIds = options.userIds;
            this.model = options.model;
            this.collection = this.model.get_talking_points();
            this.currentUser = new api.models.User({ id: 'CURRENT' });

            if(!this.userIds) {
                this.userIds = [this.currentUser.id];
            }
            
            //load data
            this.collection.filterBy({
                'user_id__in': this.userIds.join(',')
            }).fetch();
            
            //child views
            this.topicView = null;
            this.talkingPointsView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.topicView = this.topicViewFactory.create({
                model: this.model
            });

            this.talkingPointsView = this.talkingPointsViewFactory.create({
                collection: this.collection
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
