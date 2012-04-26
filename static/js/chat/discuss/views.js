define([
    'jQuery',
    'Underscore',
    'Backbone',
    'chat/agenda/models',
    'timer/views',
], function($, _, Backbone, models, timer) {

    /**
     * Disucss view.
     * @constructor
     * @param {Object} options
     *   templateSelector: html template selector (optional)
     *   timerSelector: selector for timer view (optional)
     */
    var DiscussView = Backbone.View.extend({

        templateSelector: '#discuss-template',

        timerSelector: '#discuss-timer',

        events: {
            "click .next": "next",
        },

        initialize: function() {
            this.timerSelector = this.options.timerSelector || this.timerSelector;
            this.templateSelector = this.options.templateSelector || this.templateSelector;
            this.template = _.template($(this.templateSelector).html());
            this.model = models.agenda;
            this.model.bind('change:active', this.render, this);

            this.rootTopic = this.model.topics().first();
            this.timer = null;
        },

        render: function() {
            if(this.timer) {
                this.timer.stop();
            }

            var topic = this.model.active();
            if(topic) {
                if(!this.model.isLeaf(topic)) {
                    return;
                }

                attributes = _.extend(topic.toJSON(), {
                    root: this.rootTopic.toJSON()
                });
                this.$el.html(this.template(attributes));

                this.timer = new timer.DurationTimerView({
                    el: this.timerSelector,
                    duration: topic.durationMs(),
                    interval: 500,
                });
                this.timer.render();
                this.timer.start();

            } else {
                var nextActive = this.model.nextActive();
                attributes = _.extend(nextActive.toJSON(), {
                    root: this.rootTopic.toJSON()
                });
                this.$el.html(this.template(attributes));
            }
        },

        next: function() {
            this.model.activateNext();
        },
    });
    
    return {
        DiscussView: DiscussView,
    };
});
