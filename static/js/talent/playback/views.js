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
            this.model.bind('change', this.render, this);
            this.model.eachRelated('chat__topic__tree', function(instance) {
                instance.bind('loaded', function() {console.log('loaded');});
            });

            if(options.load) {
                this.model.withRelated("chat__topic__tree", "chat_minutes__topic").fetch();

                this.model.eachRelated(['chat__topic__tree', 'chat_minutes__topic'], function(instance) {
                    if(instance.isLoading()) {
                        console.log(instance.url());
                    }
                });
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
                chatMinute: this.model.get_chat_minutes().at(0)
            };

            this.triggerEvent(EVENTS.PLAY, eventBody);
        }
    });

    return {
        EVENTS: EVENTS,
        PlaybackView: PlaybackView
    };
});
