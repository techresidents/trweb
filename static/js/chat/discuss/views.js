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
        START: 'discuss:Start'
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
            this.model.bind('change:activeMinute', this.onMinuteChange, this);

            //child views
            this.titleView = null;
            this.controlsView = null;
            this.taggerView = null;
        },

        render: function() {

            this.$el.html(this.template());
            
            this.titleView = new DiscussTitleView({
                el: this.$(this.titleSelector),
                model: this.model
            }).render();

            this.controlsView = new DiscussControlsView({
                el: this.$(this.controlsSelector),
                model: this.model
            }).render();
            
            this.taggerView = new tag_views.ChatTaggerView({
                el: this.$(this.tagSelector),
                users: this.users,
                collection: this.tags,
                maxItems: 8,
                filter: _.bind(this.tagFilter, this)
            }).render();

            return this;
        },

        onMinuteChange: function() {
            this.taggerView.applyFilter();
        },

        tagFilter: function(tag) {
            return tag.minuteId() === this.model.activeMinute().id;
        }
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
            this.model.bind('change:nextTopic', this.render, this);
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
            "click .start": "start"
        },

        initialize: function() {
            this.template = _.template(discuss_controls_template);
            this.model.bind('change:activeTopic', this.render, this);
            this.model.bind('change:nextTopic', this.render, this);
            this.timer = null;
            this.enabled = true;
        },

        render: function() {
            var state = _.extend(this.model.toJSON(),
                { enabled: this.enabled });
            this.$el.html(this.template(state));

            var activeTopic = this.model.activeTopic();
            var activeMinute = this.model.activeMinute();
            if(activeTopic && activeMinute) {
                var startTime = new Date(activeMinute.startTimestamp() * 1000.0);

                this.timer = new timer.DurationTimerView({
                    el: this.$(this.timerSelector),
                    duration: activeTopic.durationMs(),
                    interval: 500
                });
                this.timer.render();
                this.timer.start(startTime);
            }
            return this;
        },

        enable: function(enabled) {
            if(this.enabled !== enabled) {
                this.enabled = enabled;
                this.render();
            }
        },

        next: function() {
            if(this.enabled) {
                this.triggerEvent(EVENTS.NEXT);
            }
        },

        start: function() {
            if(this.enabled) {
                this.triggerEvent(EVENTS.START);
            }
        }
    });

    
    return {
        EVENTS: EVENTS,
        DiscussView: DiscussView
    };
});
