define([
    'jquery',
    'underscore',
    'core/base',
    'core/view',
    'api/loader'
], function(
    $,
    _,
    base,
    view,
    api_loader) {


    /**
     * Template View class.
     * @constructor
     */
    var TemplateView = view.View.extend({

        initialize: function(options) {
            options = _.extend({
                modelEvents: 'change',
                collectionEvents: 'reset add remove',
                load: false
            }, options);

            this.model = options.model;
            this.modelEvents = options.modelEvents;
            this.modelWithRelated = options.modelWithRelated;
            this.collection = options.collection;
            this.collectionEvents = options.collectionEvents;
            this.collectionWithRelated = options.collectionWithRelated;
            this.context = options.context;
            this.load = options.load;
            this.template = _.template(options.template);

            var loaderArgs = [];

            if(this.model) {
                this.listenTo(this.model, this.modelEvents, this.render);
                loaderArgs.push({
                    instance: this.model,
                    withRelated: this.modelWithRealted
                });
            }

            if(this.collection) {
                this.listenTo(this.collection, this.collectionEvents, this.render);
                loaderArgs.push({
                    instance: this.collection,
                    withRelated: this.collectionWithRealted
                });
            }

            if(loaderArgs.length) {
                this.loader = new api_loader.ApiLoader(loaderArgs);
                if(this.load) {
                    this.loader.load();
                }
            }
        },

        classes: function() {
            return [];
        },

        render: function() {
            var modelContext = this.model ?
                this.model.toJSON(this.modelWithRelated) :
                null;

            var collectionContext = this.collection ?
                this.collection.toJSON(this.collectionWithRelated) :
                null;

            var context = _.extend({
                model: modelContext,
                collection: collectionContext
            }, base.getValue(this, 'context', this));

            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        }
    });
    
    return {
        TemplateView: TemplateView
    };
});
