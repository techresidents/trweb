define([
    'jquery',
    'jquery.flowplayer',
    'underscore',
    'core/view',
    'text!talent/player/templates/player.html',
    'text!talent/player/templates/title.html'
], function(
    $,
    none,
    _,
    view,
    player_template,
    title_template) {

    var EVENTS = {
    };

    /**
     * Title view.
     * @constructor
     * @param {Object} options
     */
    var PlayerTitleView = view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.template =  _.template(title_template);
            this.flowplayerView = null;

            this.model.bind('change:chatMinute', this.render, this);
        },

        render: function() {
            var context = {};
            var chatMinute = this.model.chatMinute();

            if(chatMinute) {
                context.title = chatMinute.get_topic().get_title();
            } else {
                context.title = "Play something";
            }
            this.$el.html(this.template(context));
            return this;
        }
    });

    /**
     * Player view.
     * @constructor
     * @param {Object} options
     */
    var PlayerView = view.View.extend({

        events: {
        },

        childViews: function() {
            return [this.titleView];
        },

        initialize: function(options) {
            this.template =  _.template(player_template);
            this.titleView = null;
        },

        render: function() {
            var context = {};
            this.$el.html(this.template(context));
            
            this.titleView = new PlayerTitleView({
                el: this.$('#title'),
                model: this.model
            }).render();

            /*
            this.flowplayerView = new flowplayer.FlowplayerView({
                el: this.$('#player')
            }).render();
            
            //bind flowplayer events
            this.flowplayerView.api.onBegin(_.bind(this.onBegin, this));
            this.flowplayerView.api.onResume(_.bind(this.onResume, this));
            this.flowplayerView.api.onSeek(_.bind(this.onSeek, this));
            this.flowplayerView.api.onFinish(_.bind(this.onFinish, this));
            */

            return this;
        },

        onBegin: function(clip) {
            console.log("BEGIN");
            this.flowplayerView.api.seek(10);
        },

        onResume: function(clip) {
        },

        onSeek: function(clip, time) {
        },

        onFinish: function(clip) {
        },

        play: function(chatSession, chatMinute) {
            var archive, offset;
            var archives = chatSession.get_archives();
            var state = chatSession.isLoadedWith('archives');
            if(!state.loaded) {
                state.fetcher({
                    success: _.bind(this.play, this, chatSession, chatMinute)
                });
                return;
            }

            archive = archives.at(0);
            offset = chatMinute.get_start() - chatSession.get_publish() - archive.get_offset();
            if(offset < 0) {
                offset = 0;
            }

            this.$('#player').flowplayer({
                src: '/static/js/3ps/flowplayer/flowplayer-v3.2.11.swf'
            }, {

                plugins: {
                    akamai: {
                        url: '/static/js/3ps/flowplayer/AkamaiFlowPlugin.swf',
                        subClip: {clipBegin: offset / 1000.0},
                        forceNoSubclip: true
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
                    stopLiveOnPause: false,
                    url: archive.get_streaming_url()
                }

            });
            
            this.api = flowplayer();
            //this.api.play();

            this.model.set({
                chatSession: chatSession,
                chatMinute: chatMinute
            });
        },

        pause: function() {
            this.flowplayerView.api.pause();
        },

        stop: function() {
            this.flowplayerView.api.stop();
        }
    });

    return {
        EVENTS: EVENTS,
        PlayerView: PlayerView
    };
});
