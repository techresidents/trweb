define([
    'jQuery',
    'Underscore',
    'core/view',
    'chat/agenda/models',
    'timer/views',
    'text!chat/discuss/templates/discuss.html',
], function($, _, view, models, timer, discuss_template) {

    var EVENTS = {
        NEXT: 'discuss:Next',
        START: 'discuss:Start',
    };

    /**
     * Disucss view.
     * @constructor
     * @param {Object} options
     *   templateSelector: html template selector (optional)
     *   timerSelector: selector for timer view (optional)
     */
    var DiscussView = view.View.extend({

        timerSelector: '#discuss-timer',

        events: {
            "click .next": "next",
            "click .start": "start",
        },

        initialize: function() {
            this.template = _.template(discuss_template);
            this.model.bind('change:activeTopic', this.render, this);
            this.timer = null;
        },

        render: function() {

            this.$el.html(this.template(this.model.toJSON()));
            
            var activeTopic = this.model.activeTopic();
            if(activeTopic) {
                this.timer = new timer.DurationTimerView({
                    el: this.$(this.timerSelector),
                    duration: activeTopic.durationMs(),
                    interval: 500,
                });
                this.timer.render();
                this.timer.start();
            } 
            return this;
        },

        next: function() {
            this.triggerEvent(EVENTS.NEXT);
        },

        start: function() {
            this.triggerEvent(EVENTS.START);
        },

    });
    
    return {
        EVENTS: EVENTS,
        DiscussView: DiscussView,
    };
});
