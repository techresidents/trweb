define([
    'jquery',
    'underscore',
    'backbone',
    'topic/models',
    'topic/views'
], function($, _, Backbone, models, views) {

$(document).ready(function() {

    var TopicAppView = Backbone.View.extend({

        el: $('#topicapp'),
        rootTopicTitleSelector: $('#root-topic-input'),
        rootTopicDescriptionSelector: $('#root-topic-description-input'),
        rootTopicDurationSelector: $('#root-topic-duration-input'),
        rootTopicParticipantsSelector: $('#recommended-participants-input'),
        topicsFormInputSelector: $('#topics-form-input'),

        events : {
            'blur #root-topic-input' : 'rootTopicChanged',
            'blur #root-topic-description-input' : 'rootTopicDescriptionChanged',
            'blur #root-topic-duration-input' : 'rootTopicDurationChanged',
            'blur #recommended-participants-input' : 'rootTopicRecommendedParticipantsChanged'
        },

        initialize: function() {
            this.topicInput = this.$(this.rootTopicTitleSelector);
            this.rootTopicDescriptionInput = this.$(this.rootTopicDescriptionSelector);
            this.rootTopicDurationInput = this.$(this.rootTopicDurationSelector);
            this.rootTopicParticipantsInput = this.$(this.rootTopicParticipantsSelector);
            this.topicsFormInput = this.$(this.topicsFormInputSelector);

            this.topicCollection = new models.TopicCollection();
            this.topicCollection.bind('reset', this.reset, this);
            
            args = { topicCollection: this.topicCollection };
            
            //create views
            this.topicAddView = new views.TopicAddView(args);
            this.topicListView = new views.TopicListView(args);
            this.topicButtonsView = new views.TopicButtonsView(args);
            this.topicFormView = new views.TopicFormView(args);

            if(this.options.data.topic_json.length > 0) {
                this.topicCollection.reset(this.options.data.topic_json);
            } else {
                //add root topic
                var rootTopic = new models.Topic({
                            id: 0,
                            parentId: null,
                            duration: this.rootTopicDurationInput.val(),
                            recommendedParticipants: this.rootTopicParticipantsInput.val(),
                            level: 0,
                            rank: 0
                });
                
                this.topicCollection.add(rootTopic);
            }
        },

        reset: function() {
            var root = this.topicCollection.at(0);
            this.topicInput.val(root.get('title'));
        },

        rootTopicChanged: function() {
            var topic = this.topicCollection.at(0);
            topic.set({ title: this.topicInput.val() });
        },

        rootTopicDescriptionChanged: function() {
            var topic = this.topicCollection.at(0);
            topic.set({ description: this.rootTopicDescriptionInput.val() });
        },

        rootTopicDurationChanged: function() {
            var topic = this.topicCollection.at(0);
            topic.set({ duration: this.rootTopicDurationInput.val() });
        },

        rootTopicRecommendedParticipantsChanged: function() {
            var topic = this.topicCollection.at(0);
            topic.set({ recommendedParticipants: this.rootTopicParticipantsInput.val() });
        }
    });

    app = new TopicAppView({data: data});
});

    
});
