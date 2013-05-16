define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'text!./templates/topic.html',
    'text!./templates/registration.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    topic_template,
    registration_template) {

    /**
     * Topic View
     * @constructor
     * @param {Object} options
     *   model: {Topic} model (required)
     */
    var TopicView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.model = options.model;
            this.template =  _.template(topic_template);
            this.modelWithRelated = ['tree'];

            //load data
            this.loader = new api.loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated }
            ]);
            this.listenTo(this.loader, 'loaded', this.render);
            this.loader.load();
        },
        
        render: function() {
            var context = {
                topic_tree: this.model.get_tree().toJSON(),
                fmt: this.fmt // date formatting
            };
            if (this.loader.isLoaded()) {
                this.$el.html(this.template(context));
            }
            return this;
        }
    });

    /**
     * TopicRegistration View
     * @constructor
     * @param {Object} options
     *   model: {Topic} model (required)
     */
    var TopicRegistrationView = core.view.View.extend({

        events: {
        },

        topicSelector: '.chat-topic-view-hook',

        childViews: function() {
            return [this.topicView];
        },

        initialize: function(options) {
            this.model = options.model;
            this.template =  _.template(registration_template);

            //child views
            this.topicView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.topicView = new TopicView({
                model: this.model
            });
        },

        render: function() {
            this.$el.html(this.template());
            this.append(this.topicView, this.topicSelector);
            return this;
        }
    });

    return {
        TopicView: TopicView,
        TopicRegistrationView: TopicRegistrationView
    };
});
