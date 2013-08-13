define(/** @exports ui/hover/views */[
    'jquery',
    'underscore',
    'core',
    'api',
    '../events/type',
    'text!./templates/hover.html'
], function(
    $,
    _,
    core,
    api,
    events,
    hover_template) {

    var HoverView = core.view.View.extend({

        /**
         * Hover View.
         * @constructs
         * @param {Object} options
         * @param {View} options.targetView Target view to display
         *   hover view relative to.
         * @param {string} [options.targetSelector] Optional target
         *   selector with targetView to display hover view relative to.
         * @param {string} [options.placement='bottom'] Placement string -
         *   top, right, bottom, left  - indicating where to position 
         *   view.
         * @param {View|Factory} options.viewOrFactory View object or Factory
         *   returning a View object to use for the hover view content.
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
                template: hover_template,
                placement: 'bottom',
                showDelay: 0,
                hideDelay: 0,
                center: true,
                showArrow: true,
                delayViewCreate: false
            }, options);

            this.template = _.template(options.template);
            this.targetView = options.targetView;
            this.targetSelector = options.targetSelector;
            this.placement = options.placement;
            this.viewOrFactory = options.viewOrFactory;
            this.showDelay = options.showDelay;
            this.hideDelay = options.hideDelay;
            this.center = options.center;
            this.showArrow = options.showArrow;
            this.delayViewCreate = options.delayViewCreate;
            this.showTimer = null;
            this.hideTimer = null;

            //child views
            this.childView = null;
            if(!this.delayViewCreate) {
                this.childView = this.createChildView();
            }
        },

        events: {
            'mouseenter': 'onEnter',
            'mouseleave': 'onLeave'
        },

        childViews: function() {
            return [this.childView];
        },

        createChildView: function() {
            var view;
            if(this.viewOrFactory instanceof core.view.View) {
                view = this.viewOrFactory;
            } else {
                view = this.viewOrFactory.create();
            }
            return view;
        },

        delegateHoverEvents: function() {
            if(this.targetView) {
                this.undelegateHoverEvents();
                this.targetView.addEventListener(this.cid, 'mouseenter', this.onTargetEnter, this, this.targetSelector);
                this.targetView.addEventListener(this.cid, 'mouseleave', this.onTargetLeave, this, this.targetSelector);
            }
        },

        undelegateHoverEvents: function() {
            if(this.targetView) {
                this.targetView.removeEventListeners(this.cid);
            }
        },

        delegateEvents: function() {
            core.view.View.prototype.delegateEvents.apply(this, arguments);
            this.delegateHoverEvents();
        },

        undelegateEvents: function() {
            this.undelegateHoverEvents();
            core.view.View.prototype.undelegateEvents.apply(this, arguments);
        },

        target: function() {
            var result;
            if(this.targetView && this.targetSelector) {
                result = this.targetView.$(this.targetSelector);
            } else if(this.targetView) {
                result = this.targetView.$el;
            }
            return result;
        },

        classes: function() {
            var result = [
                'hover',
                'hover-' + this.placement
            ];
            if(this.showArrow) {
                result.push('hover-show-arrow');
            }
            if(this.isVisible()) {
                result.push('hover-show');
            }
            return result;
        },

        context: function() {
            return {};
        },

        render: function() {
            var context = this.context();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            if(this.childView) {
                this.append(this.childView, '.hover-content');
            }
            return this;
        },

        isVisible: function() {
            return this.$el.hasClass('hover-show');
        },

        show: function() {
            if(!this.childView) {
                this.childView = this.createChildView();
                this.render();
            }

            if(!this.isVisible()) {
                this.position();
                this.$el.addClass('hover-show');
                this.triggerEvent(events.SHOW, {
                    view: this
                });
            }
        },

        hide: function() {
            if(this.isVisible()) {
                this.$el.removeClass('hover-show');
                this.triggerEvent(events.HIDE, {
                    view: this
                });
            }
        },

        toggle: function() {
            if(this.isVisible()) {
                this.hide();
            } else {
                this.show();
            }
        },

        position: function() {
            var target = this.target();
            var offset = target.offset();

            switch(this.placement) {
                case 'top':
                    offset.top -= this.$el.outerHeight();
                    break;
                case 'right':
                    offset.left += target.outerWidth();
                    break;
                case 'bottom':
                    offset.top += target.outerHeight();
                    break;
                case 'left':
                    offset.left -= this.$el.outerWidth();
                    break;
            }

            if(this.center) {
                if(this.placement === 'top' || this.placement === 'bottom') {
                    offset.left += target.outerWidth()/2.0 - this.$el.outerWidth() / 2;
                } else {
                    offset.top += target.outerHeight()/2.0 - this.$el.outerHeight() / 2;
                }
            }

            //find first parent with absolute/relative position and get its offset
            //so we can negate it in order to position next to the target.
            var parentOffset = this.$el.offsetParent().offset();
            if(parentOffset) {
                offset.top -= parentOffset.top;
                offset.left -= parentOffset.left;
            }

            this.$el.css(offset);
        },

        onTargetEnter: function(e) {
            if(this.hideTimer) {
                clearTimeout(this.hideTimer);
                this.hideTimer = null;
            }
            this.showTimer = setTimeout(_.bind(this.show, this), this.showDelay);
        },

        onTargetLeave: function(e) {
            if(this.showTimer) {
                clearTimeout(this.showTimer);
                this.showTimer = null;
            }
            this.hideTimer = setTimeout(_.bind(this.hide, this), this.hideDelay);
        },

        onEnter: function(e) {
            if(this.hideTimer) {
                clearTimeout(this.hideTimer);
                this.hideTimer = null;
            }
            this.showTimer = setTimeout(_.bind(this.show, this), this.showDelay);
        },

        onLeave: function(e) {
            if(this.showTimer) {
                clearTimeout(this.showTimer);
                this.showTimer = null;
            }
            this.hideTimer = setTimeout(_.bind(this.hide, this), this.hideDelay);
        }
    });

    return {
        HoverView: HoverView
    };

});
