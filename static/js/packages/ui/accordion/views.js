define([
    'jquery',
    'underscore',
    'core',
    'api',
    '../events/type',
    '../ac/views',
    '../collection/views',
    './models',
    'text!./templates/accordion.html',
    'text!./templates/accordion_item.html'
], function(
    $,
    _,
    core,
    api,
    events,
    ac_views,
    collection_views,
    models,
    accordion_template,
    accordion_item_template) {


    /**
     * Accordion Item View.
     * @constructor
     * @param {object} options
     * @param {string} options.name name (i.e. offers)
     * @param {string} options.title: title (i.e. Offers)
     * @param {boolean} [options.expandable=true] If true view 
     *   can be toggled open and close by user.
     * @param {boolean} [options.open=true] If true view 
     *   will be opened initially.
     */
    var AccordionItemView = core.view.View.extend({

        defaultTemplate: accordion_item_template,

        events: {
            'click .accordion-item-header': 'onClick'
        },
        
        initialize: function(options) {
            options = _.extend({
                template: this.defaultTemplate,
                expandable: true,
                open: true
            }, options);

            this.template = _.template(options.template);
            this.name = options.name;
            this.title = options.title;
            this.viewOrFactory = options.viewOrFactory;
            this.expandable = options.expandable;
            
            //child views
            this.childView = null;
            this.initChildViews();

            if(options.open) {
                this.open();
            }
        },

        childViews: function() {
            return [this.childView];
        },

        initChildViews: function() {
            if(this.viewOrFactory instanceof core.view.View) {
                this.childView = this.viewOrFactory;
            } else {
                this.childView = this.viewOrFactory.create();
            }
        },

        context: function() {
            return {
                name: this.name,
                title: this.title,
                expandable: this.expandable
            };
        },

        classes: function() {
            var name = this.name.toLowerCase().replace(' ', '-');

            var result= [
                'accordion-item',
                'accordion-item-' + name
            ];
            
            if(this.expandable) {
                result.push('accordion-item-expandable');
            }
            if(this.isOpen()) {
                result.push('accordion-item-open');
            }
            return result;
        },

        render: function() {
            var context = this.context();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.childView, '.accordion-item-child');
            return this;
        },

        isOpen: function() {
            return this.$el.hasClass('accordion-item-open');
        },

        open: function() {
            if(!this.isOpen()) {
                this.$el.addClass('accordion-item-open');
                this.triggerEvent(events.OPEN, {
                    view: this
                });
            }
        },

        close: function() {
            if(this.isOpen()) {
                this.$el.removeClass('accordion-item-open');
                this.triggerEvent(events.CLOSE, {
                    view: this
                });
            }
        },

        toggle: function() {
            if(this.isOpen()) {
                this.close();
            } else {
                this.open();
            }
        },

        onClick: function(e) {
            if(this.expandable) {
                this.toggle();
            }
        }
    });

    AccordionItemView.Factory = core.factory.buildFactory(AccordionItemView);

    /**
     * Accordion View.
     * @constructor
     * @param {object} options
     * @param {object} options.config: Accordion config
     */
    var AccordionView = collection_views.ListView.extend({

        defaultTemplate: accordion_template,

        events: {
        },
        
        initialize: function(options) {
            options = _.extend({
                template: this.defaultTemplate,
                includeAll: false,
                viewFactory: new core.factory.FunctionFactory(
                    _.bind(this.createItemView, this))
            }, options);

            if(!options.accordionItemViewFactory) {
                options.accordionItemViewFactory =
                    new AccordionItemView.Factory();
            }

            options.collection = new models.AccordionItemCollection(
                options.config.items);

            this.config = options.config;
            this.itemConfigMap = {};
            this.accordionItemViewFactory = options.accordionItemViewFactory;
            
            collection_views.ListView.prototype.initialize.call(this, options);
        },

        classes: function() {
            return ['accordion'];
        },

        createItemView: function(options) {
            var view = null;
            var model = options.model;

            view = this.accordionItemViewFactory.create({
                name: model.name(),
                title: model.title(),
                viewOrFactory: model.viewOrFactory(),
                expandable: model.expandable(),
                open: model.open()
            });

            return view;
        }
    });

    return {
        AccordionView: AccordionView,
        AccordionItemView: AccordionItemView
    };
});
