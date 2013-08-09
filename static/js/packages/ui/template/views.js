define([
    'jquery',
    'underscore',
    'core',
    'api'
], function(
    $,
    _,
    core,
    api) {

    /**
     * Template View.
     * @constructor
     * @augments module:core/view~View
     * @param {Object} options
     * @param {String} options.template name of template to use for this view.
     *    This string value will be passed to _.template() to be compiled for
     *    rendering.
     * @param {Object} [options.context] context to pass to template for rendering
     * @param {Object} [options.model] model
     * @param {Object} [options.modelEvents='change'] model events to listen on
     * @param {Array}  [options.modelWithRelated] Array of data to load with model
     * @param {Object} [options.collection] collection
     * @param {Object} [options.collectionEvents='reset add remove'] collection
     *    events to listen on
     * @param {Array} [options.collectionWithRelated] Array of data to load with
     *    collection
     * @param {Boolean} [options.load=false] If true, will invoke the 'load' method
     *    on an instance of apiLoader.  Will load options.model, options.modelWithRelated,
     *    options.collection, and options.collectionWithRelated
     * @param {Array} [options.classes=[]] style to add to rendered element
     * @classdesc
     * A generic view that has no specialized functionality.  Best suited
     * for read-only views.
     */
    var TemplateView = core.view.View.extend({

        initialize: function(options) {
            options = _.extend({
                modelEvents: 'change',
                collectionEvents: 'reset add remove',
                load: false,
                classes: []
            }, options);

            this.model = options.model;
            this.modelEvents = options.modelEvents;
            this.modelWithRelated = options.modelWithRelated;
            this.collection = options.collection;
            this.collectionEvents = options.collectionEvents;
            this.collectionWithRelated = options.collectionWithRelated;
            this.context = options.context;
            this.load = options.load;
            this._classes = options.classes;
            this.template = _.template(options.template);

            var loaderArgs = [];

            if(this.model) {
                this.listenTo(this.model, this.modelEvents, this.render);
                loaderArgs.push({
                    instance: this.model,
                    withRelated: this.modelWithRelated
                });
            }

            if(this.collection) {
                this.listenTo(this.collection, this.collectionEvents, this.render);
                loaderArgs.push({
                    instance: this.collection,
                    withRelated: this.collectionWithRelated
                });
            }

            if(loaderArgs.length) {
                this.loader = new api.loader.ApiLoader(loaderArgs);
                if(this.load) {
                    this.loader.load();
                }
            }
        },

        classes: function() {
            return this._classes;
        },

        render: function() {
            var modelContext = this.model ?
                this.model.toJSON({withRelated: this.modelWithRelated}) : null;

            var collectionContext = this.collection ?
                this.collection.toJSON({withRelated: this.collectionWithRelated}) : null;

            var context = _.extend({
                model: modelContext,
                collection: collectionContext
            }, core.base.getValue(this, 'context', this));

            console.log(context);
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        }
    });
    
    return {
        TemplateView: TemplateView
    };
});
