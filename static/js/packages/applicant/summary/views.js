define([
    'jquery',
    'underscore',
    'core',
    'api',
    'ui',
    '../handler',
    'text!./templates/summary.html'
], function(
    $,
    _,
    core,
    api,
    ui,
    handler,
    summary_template) {

    /**
     * Application Summary View
     */
    var ApplicationSummaryView = core.view.View.extend({

        /**
         * @constructs
         * @param {object} options Options object
         * @param {options.Application} model Application model
         */
        initialize: function(options) {
            options = _.extend({
                template: this.defaultTemplate
            }, options);

            this.model = options.model;
            this.template = _.template(options.template);
            this.handler = new handler.ApplicantHandler({
                model: this.model,
                view: this
            });
            this.menuCollection = new ui.menu.models.MenuItemCollection();
            this.menuCollection.reset(this.handler.menuItems());
            this.loader = new api.loader.ApiLoader([{
                instance: this.model,
                withRelated: ['requisition']
            }]);

            //events
            this.listenTo(this.model, 'change', this.onChange);
            this.listenTo(this.loader, 'loaded', this.render);

            //load data
            this.loader.load();

            //child views 
            this.menuView = null;
            this.initChildViews();
        },

        defaultTemplate: summary_template,

        events: {
            'click .drop-button': 'onMenuClick'
        },

        childViews: function() {
            return [this.menuView];
        },

        initChildViews: function() {
            this.menuView = new ui.menu.views.DropMenuView({
                collection: this.menuCollection,
                targetView: this,
                targetSelector: '.drop-button'
            });
        },

        classes: function() {
            return ['application-summary'];
        },

        render: function() {
            var context = {
                model: this.model.toJSON({
                    withRelated: ['requisition']
                }),
                fmt: core.format
            };

            if(this.loader.isLoaded()) {
                this.$el.html(this.template(context));
                this.$el.attr('class', this.classes().join(' '));
                this.append(this.menuView);
            }

            return this;
        },

        onChange: function() {
            this.menuCollection.reset(this.handler.menuItems());
            this.render();
        },

        onMenuClick: function(e) {
            this.menuView.toggle();
        }
    });

    return {
        ApplicationSummaryView: ApplicationSummaryView
    };
});
