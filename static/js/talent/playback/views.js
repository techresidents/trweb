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

    EVENTS = {
    };

    /**
     * Talent user view.
     * @constructor
     * @param {Object} options
     *   model: {ChaSession} (required)
     */
    var PlaybackView = view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.template =  _.template(playback_template);
            this.model.bind('change', this.render, this);

            if(options.load) {
                this.model.withRelated("chat__topic__tree", "archives").fetch();
            }
        },

        render: function() {
            var context = this.model.toJSON({withRelated: true});
            this.$el.html(this.template(context));
            return this;
        }
    });

    return {
        EVENTS: EVENTS,
        PlaybackView: PlaybackView
    };
});
