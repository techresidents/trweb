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
            return [this.flowplayerView, this.titleView];
        },

        initialize: function(options) {
            this.template =  _.template(player_template);
            this.flowplayerView = null;
            this.titleView = null;

            this.model.bind('change', this.onChange, this);
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

        onChange: function() {
            var archives;
            var chatSession = this.model.chatSession();
            var chatMinute = this.model.chatMinute();

            if(chatSession && chatMinute) {
                archives = chatSession.get_archives();
                if(archives.length) {
                    this.play();
                }else {
                    archives.bind('reset', this.play, this);
                    archives.fetch();
                }
            } else {
                this.stop();
            }
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

        play: function() {

            this.$('#player').flowplayer({
                src: '/static/js/3ps/flowplayer/flowplayer-v3.2.11.swf'
            }, {

                plugins: {
                    akamai: {
                        url: '/static/js/3ps/flowplayer/AkamaiFlowPlugin.swf',
                        subClip: {clipBegin: 0},
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
                    stopLiveOnPause: false
                }

            });
            
            this.api = flowplayer();
            console.log("play");
            var chatSession = this.model.chatSession();
            var archives = chatSession.get_archives();
            var minutes = chatSession.get_chat_minutes();
            var publish = chatSession.get_publish();
            var start = minutes.at(0).get_start();

            var archive = archives.at(0);
            
            var cuepoints = [];
            var that = this;
            minutes.each(function(minute) {
                cuepoints.push({
                    time: minute.get_start() - publish - archive.get_offset()
                });
            });
            console.log(cuepoints);
            //cuepoints = [{time: 0}, {time: 0}];

            if(archives.length) {
                archive = archives.at(0);
                var clip = {
                    url: archive.get_streaming_url(),
                    onCuepoint: [
                        cuepoints,
                        function(clip, cuepoint) {
                            console.log(cuepoint.time);
                            //cuepoint.model.set({chatMinute: cuepoint.minute});
                        }
                    ]
                };
                console.log(clip);
                console.log(this.api);
                this.api.setClip(clip);
                this.api.play(clip);
            }
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
