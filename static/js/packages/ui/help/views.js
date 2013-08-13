define(/** @exports ui/help/views */[
    'jquery',
    'underscore',
    'core',
    'api',
    '../hover/views',
    'text!./templates/help.html',
    'text!./templates/help_content.html'
], function(
    $,
    _,
    core,
    api,
    hover_views,
    help_template,
    help_content_template) {

    var HelpView = core.view.View.extend({

        /**
         * Help View.
         * @constructs
         * @param {Object} options
         * @param {string} options.help Help text or html.
         * @param {string} [options.placement='bottom'] Placement string -
         *   top, right, bottom, left  - indicating where to position 
         *   view.
         * @param {View|Factory} [options.viewOrFactory] View object or Factory
         *   returning a View object to use for the tooltip content.
         * @param {boolean} [options.delayViewCreate=false] Flag indicating 
         *   that the hover view child view (content view) should not be
         *   created until the first time the target view is hovered on
         *   long enough to trigger a show.
         * @param {boolean} [options.showDelay=0] Number of milliseconds to
         *   delay on hover before showing the hover view.
         * @param {boolean} [options.hideDelay=0] Number of milliseconds to
         *   delay on hover exit before hiding the hover view.
         * @param {boolean} [options.center=true] Flag indicating that the
         *   hover view should be centered relative to target view.
         * @param {boolean} [options.showArrow=true] Flag indicating that the
         *   hover view arrow should be shown.
         * @param {string} [options.template] Template to use in render.
         */
        initialize: function(options) {
            options = _.extend({
                template: help_template,
                placement: 'right',
                iconClasses: 'icon-question-sign icon-large', 
                delayViewCreate: false,
                showDelay: 200,
                hideDelay: 100,
                center: true,
                showArrow: true
            }, options);

            if(!options.viewOrFactory) {
                options.viewOrFactory = new HelpContentView.Factory({
                    help: options.help
                });
            }

            this.template = _.template(options.template);
            this.help = options.help;
            this.placement = options.placement;
            this.iconClasses = options.iconClasses;
            this.targetSelector = options.targetSelector;
            this.viewOrFactory = options.viewOrFactory;
            this.delayViewCreate = options.delayViewCreate;
            this.showDelay = options.showDelay;
            this.hideDelay = options.hideDelay;
            this.center = options.center;
            this.showArrow = options.showArrow;

            //child views
            this.hoverView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [this.hoverView];
        },

        initChildViews: function() {
            this.hoverView = new hover_views.HoverView({
                targetView: this,
                targetSelector: this.targetSelector,
                viewOrFactory: this.viewOrFactory,
                placement: this.placement,
                delayViewCreate: this.delayViewCreate,
                showDelay: this.showDelay,
                hideDelay: this.hideDelay,
                center: this.center,
                showArrow: this.showArrow
            });
        },

        classes: function() {
            return ['help'];
        },

        context: function() {
            return {
                iconClasses: this.iconClasses
            };
        },

        render: function() {
            var context = this.context();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.hoverView);
            return this;
        }
    });

    var HelpContentView = core.view.View.extend({

        /**
         * Help Content View.
         * @constructs
         * @param {Object} options
         * @param {string} options.help Help text or html.
         */
        initialize: function(options) {
            options = _.extend({
                template: help_content_template
            }, options);

            this.template = _.template(options.template);
            this.help = options.help;
        },

        context: function() {
            return {
                help: this.help
            };
        },

        classes: function() {
            return ['help-content'];
        },

        render: function() {
            var context = this.context();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        }
    });

    /**
     * {@link module:core/factory~Factory|Factory} class for convenience.
     */
    HelpContentView.Factory = core.factory.buildFactory(HelpContentView);

    
    return {
        HelpView: HelpView,
        HelpContentView: HelpContentView
    };

});
