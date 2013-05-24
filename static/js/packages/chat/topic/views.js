define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'events',
    'text!./templates/topic.html',
    'text!./templates/topic_tree.html',
    'text!./templates/registration.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    events,
    topic_template,
    topic_tree_template,
    registration_template) {


    /**
     * Topic View
     * Displays a single topic (e.g. no sub-topics)
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

            //load data
            this.loader = new api.loader.ApiLoader([
                { instance: this.model }
            ]);
            this.listenTo(this.loader, 'loaded', this.render);
            this.loader.load();
        },

        render: function() {
            var context = {
                topic: this.model.toJSON(),
                fmt: this.fmt // date formatting
            };
            if (this.loader.isLoaded()) {
                this.$el.html(this.template(context));
            }
            return this;
        }
    });

    /**
     * TopicTree View
     * Displays a Root topic and all sub-topics
     * @constructor
     * @param {Object} options
     *   model: {Topic} Root topic model (required)
     */
    var TopicTreeView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.model = options.model;
            this.template =  _.template(topic_tree_template);
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
                topicTree: this.model.get_tree().toJSON(),
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

        topicSelector: '.chat-topic-view-hook',
        setupBtnSelector: '.setup-chat-btn',

        events: {
            'click .setup-chat-btn': 'onSetupChat'
        },

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
            this.topicView = new TopicTreeView({
                model: this.model
            });
        },

        render: function() {
            this.$el.html(this.template());
            this.append(this.topicView, this.topicSelector);
            return this;
        },

        onSetupChat: function() {
            eventBody = {
                type: 'TalkingPointView',
                id: this.model.id
            };
            this.triggerEvent(events.VIEW_NAVIGATE, eventBody);
        }
    });

    return {
        TopicView: TopicView,
        TopicTreeView: TopicTreeView,
        TopicRegistrationView: TopicRegistrationView
    };
});
