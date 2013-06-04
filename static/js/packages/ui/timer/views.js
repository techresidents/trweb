define([
    'jquery',
    'underscore',
    'core',
    'text!./templates/duration_timer.html'
], function(
    $,
    _,
    core,
    duration_timer_template) {


    /**
     * Duration Timer View.
     * @constructor
     * @param {Object} options
     * @param options.duration timer duration in ms
     * @param [options.interval=500] update interval in ms
     * @param [options.runningClass='running'] style to add when
     *   timer is running
     * @param [options.expiredClass='expired'] style to add when
     *   timer exceeds duration
     */
    var DurationTimerView = core.view.View.extend({

        defaultTemplate: duration_timer_template,

        events: {
        },
        
        initialize: function(options) {
            options = _.extend({
                template: duration_timer_template,
                interval: 500,
                runningClass: 'running',
                expiredClass: 'expired'
            }, options);

            this.template = _.template(options.template);
            this.duration = options.duration;
            this.interval = options.interval;
            this.runningClass = options.runningClass;
            this.expiredClass = options.expiredClass;

            this.startTime = null;
            this.stopTime = null;
            this.running = false;
            this.expired = false;
            this.intervalId = null;
        },

        setDuration: function(duration) {
            this.duration = duration;
            return this;
        },

        classes: function() {
            return ['timer'];
        },

        render: function() {
            this.$el.html(this.template());
            this.$el.attr('class', this.classes().join(' '));
            this.updateTimer();
            return this;
        },
       
        /**
         * Start the timer.
         * @param {Date} startTime optional start time. If provided,
         * the timer will behave as if the timer was started at
         * the time provided. If not provided, start time is assumed
         * to be the current time.
         */
        start: function(startTime) {
            this.running = true;
            this.startTime = startTime || Date.now();
            this.stopTime = null;
            this.$el.addClass(this.runningClass);
            this.updateTimer();

            var that = this;
            this.intervalId = setInterval(
                _.bind(this.updateTimer, this),
                this.interval);
        },

        /**
         * Stop the timer.
         */
        stop: function() {
            if(this.running) {
                this.running = false;
                this.stopTime = new Date();

                clearInterval(this.intervalId);
                this.intervalId = null;
                
                this.updateTimer();
            }
        },
        
        /**
         * Update the timer display.
         */
        updateTimer: function() {
            var remaining = this.duration;

            if(this.running) {
                this.$el.addClass(this.runningClass);
                remaining = this.duration - (new Date() - this.startTime);
            } else {
                this.$el.removeClass(this.runningClass);
            }

            if(remaining < 0) {
                this.$el.addClass(this.expiredClass);
            }

            this.$el.text(core.format.timer(remaining));
        },

        destroy: function() {
            this.stop();
            DurationTimerView.__super__.destroy.call(this);
        }
    });

    return {
        DurationTimerView: DurationTimerView
    };

});
