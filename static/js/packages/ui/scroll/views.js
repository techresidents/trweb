define([
    'jquery',
    'underscore',
    'core'
], function(
    $,
    _,
    core) {


    /**
     * Scroller View.
     * @constructor
     * @param {Object} options
     * @classdesc
     * Scroller View automatically resizes itself to the max height based on
     * the size of the window. This is useful for composing scrollable views
     * which should fill the window.
     *
     * @example
     * function render() {
     *   this.$el.html();
     *   this.append(this.scrollerView);
     *
     *   //append scrollable views
     *   this.scrollerView.append(this.viewOne);
     *   this.scrollerView.append(this.viewTwo);
     * }
     */
    var ScrollerView = core.view.View.extend({

        events: {
            'resize': 'onResize'
        },
        
        initialize: function(options) {
            options = _.extend({
                interval: 0
            }, options);

            this.interval = options.interval;

            if(this.interval) {
                this.timer = setInterval(_.bind(this.resize, this), this.interval);
            }
        },

        delegateEventName: function(eventName) {
            //use delegate events so they're removed on destroy()
            return eventName + '.delegateGlobalEvents' + this.cid;
        },

        undelegateGlobalEvents: function() {
            $('html').off(this.delegateEventName(''));
        },

        delegateEvents: function() {
            ScrollerView.__super__.delegateEvents.apply(this, arguments);
            $(window).on(this.delegateEventName('resize'),
                    _.bind(this.onResize, this));
        },

        undelegateEvents: function() {
            this.undelegateGlobalEvents();
            ScrollerView.__super__.undelegateEvents.apply(this, arguments);
        },

        classes: function() {
            return ['scroller'];
        },

        render: function() {
            this.$el.html();
            this.$el.attr('class', this.classes().join(' '));
            this.resize();

            //resize again in 500ms just in case we're not yet on the dom
            this.delayedResize(500);
            return this;
        },

        resize: function() {
            var height = this.$el.outerHeight();
            var offset = this.$el.offset();
            var windowHeight = $(window).height();

            //TODO figure out why we're off by 20 pixels
            var newHeight = windowHeight - offset.top - 20;

            if(newHeight !== height) {
                this.$el.height(newHeight);
            }
        },

        delayedResize: function(delay) {
            setTimeout(_.bind(this.resize, this), delay);
        },

        onResize: function() {
            this.resize();
        }
    });
       
    return {
        ScrollerView: ScrollerView
    };

});
