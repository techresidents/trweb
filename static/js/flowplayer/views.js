define([
    'require',
    'jquery',
    'underscore',
    'core/view',
    'jquery.flowplayer'
], function(
    require,
    $,
    _,
    view,
    none) {

    /**
     * Flowplayer view.
     * @constructor
     * @param {Object} options
     *   model: ChatSession model (required)
     */

    var FlowplayerView = view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.$el.flowplayer({
                src: '/static/js/3ps/flowplayer/flowplayer-v3.2.11.swf'
            }, {

                plugins: {
                    akamai: {
                        url: '/static/js/3ps/flowplayer/AkamaiFlowPlugin.swf'
                    },

                    controls: {
                        height: 25,
                        fullscreen: false,
                        autoHide: false
                    }
                },

                clip: {
                    live: false,
                    provider: 'akamai',
                    autoPlay: false,
                    stopLiveOnPause: false
                }

            });
            
            this.api = flowplayer();
        },

        render: function() {
            return this;
        }
    });

    return {
        FlowplayerView: FlowplayerView
    };
});
