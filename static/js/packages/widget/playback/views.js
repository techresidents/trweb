define([
    'jquery',
    'underscore',
    'core',
    'api',
    'ui',
    'events',
    'text!./templates/playback_brief.html'
], function(
    $,
    _,
    core,
    api,
    ui,
    events,
    playback_brief_template) {

    var PlaybackBriefView = core.view.View.extend(
        /** @lends module:widget/offer/views~PlaybackBriefView.prototype */
        {

        /**
         * Constructor
         * @constructs
         * @param {Object} options
         * @param {Chat} options.chat Chat model
         * @param {PlayerState} options.playerState Player state model
         */
        initialize: function(options) {
            options = _.extend({
                template: playback_brief_template
            }, options);

            this.playerState = options.playerState;
            this.context = options.context;
            this.template = _.template(options.template);
            this.modelWithRelated = ['topic'];
            
            //bind events
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.playerState, 'change:state', this.render);

            this.loader = new api.loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated }
            ]);

            this.loader.load();
        },

        events: {
            'click .play': 'onPlay',
            'click .pause': 'onPause'
        },

        classes: function() {
            return ['w-playback-brief'];
        },

        defaultContext: function() {
            var duration = (this.model.get_end() - this.model.get_start()) / 1000;

            return {
                model: this.model.toJSON({ withRelated: this.modelWithRelated }),
                fmt: this.fmt,
                playing: this.isPlaying(),
                duration: duration,
                href: null
            };
        },
        
        render: function() {
            var context = _.extend(this.defaultContext(),
                    core.base.getValue(this, 'context', this));
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        },

        isPlaying: function() {
            var result = false;
            var chat = this.playerState.chat();
            if(chat && chat.id === this.model.id) {
                result = this.playerState.state() === this.playerState.STATE.PLAYING;
            }
            return result;
        },

        onPlay: function(e) {
            var eventBody = {
                chat: this.model
            };
            this.triggerEvent(events.PLAYER_PLAY, eventBody);
        },

        onPause: function(e) {
            this.triggerEvent(events.PLAYER_PAUSE, {});
        }
    });

    return {
        PlaybackBriefView: PlaybackBriefView
    };
});
