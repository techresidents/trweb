define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'text!./templates/details.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    topic_details_template) {

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
            this.template =  _.template(topic_details_template);
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

    return {
        TopicView: TopicView
    };
});
