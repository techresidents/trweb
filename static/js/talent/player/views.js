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
            var rootMinute, activeMinute, context = {};
            if(this.model.state() !== this.model.STATE.EMPTY) {
                rootMinute = this.model.chatSession().get_chat_minutes().at(0);
                activeMinute = this.model.chatMinute();
                if(rootMinute.id !== activeMinute.id) {
                    context.title = rootMinute.get_topic().get_title()
                        + ' - ' + activeMinute.get_topic().get_title();
                } else {
                    context.title = activeMinute.get_topic().get_title();
                }
            } else {
                context.title = 'Play something';
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

        load: function(chatSession, chatMinute) {
            var state, result=true;
            
            if(!chatSession.isLoading()) {
                state = chatSession.isLoadedWith('chat_minutes', 'archives');
                if(!state.loaded) {
                    result = false;
                    state.fetcher({
                        success: _.bind(this.play, this, chatSession, chatMinute)
                    });
                }
            }
            
            if(!chatMinute.isLoading() && !chatMinute.isLoaded()) {
                result = false;
                chatMinute.fetch({
                    success: _.bind(this.play, this, chatSession, chatMinute)
                });
            }
            
            return result;
        },

        render: function() {
            var context = {};
            this.$el.html(this.template(context));
            
            this.titleView = new PlayerTitleView({
                el: this.$('#title'),
                model: this.model
            }).render();

            return this;
        },

        bindFlowplayerEvents: function(api) {
            api.onBegin(_.bind(this.onBegin, this));
            api.onResume(_.bind(this.onResume, this));
            api.onSeek(_.bind(this.onSeek, this));
            api.onFinish(_.bind(this.onFinish, this));
        },

        onBegin: function(clip) {
            this.model.set({
                state: this.model.STATE.PLAYING
            });
        },

        onResume: function(clip) {
            this.model.set({
                state: this.model.STATE.PLAYING
            });
        },

        onSeek: function(clip, time) {
        },

        onFinish: function(clip) {
            this.model.set({
                state: this.model.STATE.STOPPED
            });
        },

        play: function(chatSession, chatMinute) {
            var archive, offset;
            var loaded = this.load(chatSession, chatMinute);
            if(!loaded) {
                return;
            }

            archive = chatSession.get_archives().at(0);
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
            this.bindFlowplayerEvents(this.api);
            //this.api.play();

            this.model.set({
                chatSession: chatSession,
                chatMinute: chatMinute,
                state: this.model.STATE.PLAYING
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
