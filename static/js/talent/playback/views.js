define([
    'jquery',
    'underscore',
    'core/view',
    'flowplayer/views',
    'text!talent/playback/templates/playback.html'
], function(
    $,
    _,
    view,
    flowplayer,
    playback_template) {

    EVENTS = {
    };

    /**
     * Playback view.
     * @constructor
     * @param {Object} options
     *   model: {ChaSession} (required)
     */
    var PlaybackView = view.View.extend({

        events: {
        },

        childViews: function() {
            return [this.flowplayerView];
        },

        initialize: function(options) {
            this.template =  _.template(playback_template);
            this.model.bind('change', this.render, this);
            this.flowplayerView = null;

            if(options.load) {
                this.model.withRelated("chat__topic__tree", "archives").fetch();
            }
        },

        render: function() {
            var context = this.model.toJSON({withRelated: true});
            this.$el.html(this.template(context));

            this.flowplayerView = new flowplayer.FlowplayerView({
                el: this.$('#player')
            });
            
            if(this.model.isLoaded()) {
                var archives = this.model.get_archives();
                if(archives.length) {
                    this.flowplayerView.api.play(archives.at(0).get_streaming_url());

                }
            }
            
            return this;
        }
    });

    return {
        EVENTS: EVENTS,
        PlaybackView: PlaybackView
    };
});
