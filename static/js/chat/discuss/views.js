define([
    'jQuery',
    'Underscore',
    'core/view',
    'chat/agenda/models',
    'chat/tag/views',
    'timer/views',
    'text!chat/discuss/templates/discuss.html',
    'text!chat/discuss/templates/discuss_title.html',
    'text!chat/discuss/templates/discuss_controls.html'
], function(
    $,
    _,
    view,
    models,
    tag_views,
    timer,
    discuss_parent_template,
    discuss_title_template,
    discuss_controls_template)
{

    /**
     * Discuss View Events
     */
    var EVENTS = {
        NEXT: 'discuss:Next',
        START: 'discuss:Start',
    };

    /**
     * Parent Discuss view.
     * @constructor
     * @param {Object} options View options
     */
    var DiscussView = view.View.extend({

        titleSelector: '#discussion-title',

        controlsSelector: '#discussion-controls',

        tagSelector: '#discussion-tagger',

        initialize: function() {
            this.template = _.template(discuss_parent_template);
            this.users = this.options.users;
            this.tags = this.options.tags;
        },

        render: function() {

            this.$el.html(this.template());

            new DiscussTitleView({
                el: this.$(this.titleSelector),
                model: this.model,
            }).render();


            new DiscussControlsView({
                el: this.$(this.controlsSelector),
                model: this.model,
            }).render();


            new tag_views.ChatTaggerView({
                el: this.$(this.tagSelector),
                users: this.users,
                collection: this.tags
            }).render();

            return this;
        },
    });

    /**
     * Discussion title view.
     * Responsible for rendering the discussion topic.
     * @constructor
     * @param {Object} options
     *   templateSelector: html template selector (optional)
     */
    var DiscussTitleView = view.View.extend({

        initialize: function() {
            this.template = _.template(discuss_title_template);
            this.model.bind('change:activeTopic', this.render, this);
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    /**
     * Discussion controls view.
     * Responsible for rendering a view to control the discussion (e.g. start, next topic, etc)
     * @constructor
     * @param {Object} options
     *   templateSelector: html template selector (optional)
     *   timerSelector: selector for timer view (optional)
     */
    var DiscussControlsView = view.View.extend({

        timerSelector: '#discuss-timer',

        events: {
            "click .next": "next",
            "click .start": "start",
        },

        initialize: function() {
            this.template = _.template(discuss_controls_template);
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





    /**
     * Disucss view.
     * @constructor
     * @param {Object} options
     *   templateSelector: html template selector (optional)
     *   timerSelector: selector for timer view (optional)
     */
    var DiscussOldView = view.View.extend({

        timerSelector: '#discuss-timer',

        events: {
            "click .next": "next",
            "click .start": "start",
        },

        initialize: function() {
            this.template = _.template(discuss_parent_template);
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
