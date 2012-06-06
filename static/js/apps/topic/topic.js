define([
    'jQuery',
    'Underscore',
    'Backbone',
    'topic/models',
    'topic/views'
], function($, _, Backbone, models, views) {

$(document).ready(function() {

    var TopicAppView = Backbone.View.extend({

        el: $('#topicapp'),

        events : {
            'blur #root-topic-input' : 'rootTopicChanged'
        },

        initialize: function() {
            this.topicInput = this.$('#root-topic-input');
            this.topicsFormInput = this.$('#topics-form-input');

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
        }
    });

    app = new TopicAppView({data: data});
});

    
});
