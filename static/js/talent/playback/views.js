define([
    'jquery',
    'underscore',
    'core/view',
    'text!talent/playback/templates/playback.html'
], function(
    $,
    _,
    view,
    playback_template) {

    var EVENTS = {
        PLAY: 'playback:Play'
    };

    /**
     * Playback view.
     * @constructor
     * @param {Object} options
     *   model: {ChaSession} (required)
     */
    var PlaybackView = view.View.extend({

        events: {
            'click .play': 'play'
        },

        initialize: function(options) {
            this.template =  _.template(playback_template);
            this.model.bind('loaded', this.loaded, this);
            this.model.bind('change', this.render, this);
            
            if(!this.model.isLoading()) {
                this.load();
            }
        },
        
        loaded: function(instance) {
            this.load();
        },

        load: function() {
            var state = this.model.isLoadedWith('chat__topic__tree', 'chat_minutes__topic');
            if(!state.loaded) {
                state.fetcher();
            }
        },

        render: function() {
            var context = this.model.toJSON({withRelated: true});
            this.$el.html(this.template(context));
            return this;
        },

        play: function(e) {
            var eventBody = {
                chatSession: this.model,
                chatMinute: this.model.get_chat_minutes().at(1)
            };

            this.triggerEvent(EVENTS.PLAY, eventBody);
        }
    });

    return {
        EVENTS: EVENTS,
        PlaybackView: PlaybackView
    };
});
