define([
    'jQuery',
    'Underscore',
    'Backbone',
    'timer/util'
], function($, _, Backbone, util) {
    

    /**
     * Duration timer view.
     * @constructor
     * @param {Object} options
     *   duration: timer duration in ms (required)
     *   interval: view update interval in ms (optional)
     *   runningClass: style to add when timer is running (optional)
     *   expredClass: style to add when timer exceeds duration (optional)
     */
    var DurationTimerView = Backbone.View.extend({

        initialize: function() {
            this.duration = this.options.duration;
            this.interval = this.options.interval || 1000;
            this.runningClass = this.options.running || 'running';
            this.expiredClass = this.options.selectedClass || 'expired';
            this.startTime = null;
            this.stopTime = null;
            this.running = false;
            this.expired = false;
            this.intervalId = null;
        },
        
        render: function() {
            this.$el.text(util.formatTimer(this.duration));

            if(this.running) {
                this.$el.addClass(this.runningClass);
            }
            if(this.expired) {
                this.$el.addClass(this.expiredClass);
            }
            return this;
        },
        
        /**
         * Set the timer duration.
         * @param {Number} duration in ms
         */
        setDuration: function(duration) {
            this.duration = duration;
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

            var that = this;
            this.intervalId = setInterval(function() {
                that.updateTimer.call(that);
            }, this.interval);
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

                this.$el.removeClass(this.runningClass);
            }
        },

        /**
         * Update the timer display.
         */
        updateTimer: function() {
            var remaining = this.duration - (new Date() - this.startTime);
            if(remaining < 0) {
                this.$el.addClass(this.expiredClass);
            }

            this.$el.text(util.formatTimer(remaining));
        }
    });

    return {
        DurationTimerView: DurationTimerView
    };
});
