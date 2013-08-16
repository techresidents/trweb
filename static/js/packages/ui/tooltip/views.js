define(/** @exports ui/tooltip/views */[
    'jquery',
    'underscore',
    'core',
    'api',
    '../hover/views',
    'text!./templates/tip.html'
], function(
    $,
    _,
    core,
    api,
    hover_views,
    tip_template) {

    var TooltipView = hover_views.HoverView.extend({

        /**
         * Tooltip View.
         * @constructs
         * @param {Object} options
         * @param {string} options.tip Tooltip text or html.
         * @param {View} options.targetView Target view to display
         *   hover view relative to.
         * @param {string} [options.targetSelector] Optional target
         *   selector with targetView to display hover view relative to.
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
            if(!options.viewOrFactory) {
                options.viewOrFactory = new TooltipTipView.Factory({
                    tip: options.tip
                });
            }
            TooltipView.__super__.initialize.call(this, options);
        },

        classes: function() {
            var result = TooltipView.__super__.classes.call(this);
            result.push('ui-tooltip');
            return result;
        }
    });

    var TooltipTipView = core.view.View.extend({

        /**
         * Tooltip Tip View.
         * @constructs
         * @param {Object} options
         * @param {string} options.tip Tooltip text or html.
         */
        initialize: function(options) {
            options = _.extend({
                template: tip_template
            }, options);

            this.template = _.template(options.template);
            this.tip = options.tip;
        },

        context: function() {
            return {
                tip: this.tip
            };
        },

        classes: function() {
            return ['ui-tooltip-tip'];
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
    TooltipTipView.Factory = core.factory.buildFactory(TooltipTipView);

    
    return {
        TooltipView: TooltipView,
        TooltipTipView: TooltipTipView
    };

});
