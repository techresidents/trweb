define([
    'jquery',
    //'jquery.flowplayer',
    'underscore',
    'soundmanager',
    'core',
    './models',
    'text!./templates/button.html',
    'text!./templates/player.html',
    'text!./templates/scrubber.html',
    'text!./templates/timer.html',
    'text!./templates/title.html',
    'text!./templates/user.html',
    'text!./templates/users.html'
], function(
    $,
    //none,
    _,
    soundManager,
    core,
    player_models,
    button_template,
    player_template,
    scrubber_template,
    timer_template,
    title_template,
    user_template,
    users_template) {

    var EVENTS = {
        PLAY: 'PLAY_EVENT',
        PAUSE: 'PAUSE_EVENT',
        SEEK: 'SEEK_EVENT',
        FINISHED: 'FINISHED_EVENT'
    };

    /**
     * Player timer view.
     * @constructor
     * @param {Object} options
     *   model: {PlayerState} model (required)
     */
    var PlayerTimerView = core.view.View.extend({

        initialize: function(options) {
            this.template =  _.template(timer_template);
            this.listenTo(this.model, 'change:offset', this.render);
        },

        render: function() {
            var remaining = this.model.duration() - this.model.offset();
            if(_.isNaN(remaining)) {
                remaining = 0;
            }
            var timer = core.format.timer(remaining * -1000.0);
            var context = {
                timer: timer
            };
            this.$el.html(this.template(context));
            return this;
        }
    });

    /**
     * Player scrubber view.
     * @constructor
     * @param {Object} options
     *   model: {PlayerState} model (required)
     */
    var PlayerScrubberView = core.view.View.extend({

        events: {
            'click .player-scrubber-container': 'onClick',
            'mousemove .player-scrubber-container': 'onMouseMove',
            'mouseleave .player-scrubber-container': 'onMouseLeave'
        },

        initialize: function(options) {
            this.template =  _.template(scrubber_template);
            this.timerId = null;
            this.progress = 0;
            
            //bind events
            this.listenTo(this.model, 'change:chat', this.render);
            this.listenTo(this.model, 'change:offset', this.offsetChanged);
            this.listenTo(this.model, 'change:buffered', this.bufferedChanged);
        },

        render: function() {
            var context = {};
            this.$el.html(this.template(context));
            this.$('.player-scrubber-tracker').hide();
            this._loadWaveform();
            return this;
        },

        offsetChanged: function() {
            var width = (this.model.offset() / this.model.duration()) * 100;
            width = Math.min(width, 100);
            this.$('.player-scrubber-progress').animate({width: width + '%'});
        },

        bufferedChanged: function() {
            var width = (this.model.buffered() / this.model.duration()) * 100;
            width = Math.min(width, 100);
            this.$('.player-scrubber-buffer').animate({width: width + '%'});
        },

        onClick: function(e) {
            var percent, offset;
            
            if(!this.model.isEmpty()) {
                percent = this._eventLocation(e).percent;
                offset = this.model.duration() * percent;
                this.triggerEvent(EVENTS.SEEK, {
                    offset: offset
                });
            }
        },

        onMouseMove: function(e) {
            var eventLocation;
            if(!this.model.isEmpty()) {
                eventLocation = this._eventLocation(e);
                this.$('.player-scrubber-tracker').offset({left: eventLocation.left});
                this.$('.player-scrubber-tracker').show();
            }
        },

        onMouseLeave: function(e) {
            this.$('.player-scrubber-tracker').hide();
        },

        _eventLocation: function(e) {
            var waveform = this.$('.player-scrubber-container');
            var percent = (e.clientX - waveform.offset().left) / waveform.width();
            var left = waveform.offset().left + percent * waveform.width();
            return {
                percent: percent,
                left: left
            };
        },

        _loadWaveform: function() {
            var that = this;
            var waveformUrl, image;
            var archive = this.model.archive();
            if(archive && archive.get_waveform_url()) {
                waveformUrl = archive.get_waveform_url();
            } else {
                waveformUrl = '/static/img/waveform-none.png';
            }
            
            //reduce flicker by loading waveform image before we set it on scrubber
            image = new Image();
            image.onload = function() {
                that.$('.player-scrubber-waveform').css('background-image', 'url(' + waveformUrl + ')');
                that.$('.player-scrubber-default-waveform').hide();
            };
            image.src = waveformUrl;
        }
    });

    /**
     * Player user view.
     * @constructor
     * @param {Object} options
     *   model: {PlayerUser} model (required)
     */
    var PlayerUserView = core.view.View.extend({

        initialize: function(options) {
            this.template = _.template(user_template);
            this.listenTo(this.model, 'change', this.render);
        },

        render: function() {
            var context = this.model.toJSON({withRelated: true});
            this.$el.html(this.template(context)).hide().fadeIn(500);
            this.$el.addClass('player-user');
            return this;
        }
    });

    /**
     * Player users view.
     * @constructor
     * @param {Object} options
     *   model: {PlayerState} model (required)
     */
    var PlayerUsersView = core.view.View.extend({

        initialize: function(options) {
            this.template =  _.template(users_template);
            this.collection = this.model.users();

            //bind events
            this.listenTo(this.collection, 'reset', this.onReset);
            this.listenTo(this.collection, 'add', this.onAdd);

            //child views
            this.childViews = [];
            this.initChildViews();
        },

        initChildViews: function() {
            this.destroyChildViews();
            this.childViews = [];
            this.collection.each(this.createChildView, this);
        },

        createChildView: function(model) {
            var view = new PlayerUserView({
                model: model
            }).render();
            this.childViews.push(view);
            return view;
        },

        render: function() {
            var context = this.model.toJSON({withRelated: true});
            this.$el.html(this.template(context));
            _.each(this.childViews, function(view) {
                this.append(view);
            }, this);
            return this;
        },

        onReset: function() {
            this.initChildViews();
            this.render();
        },

        onAdd: function(model) {
            var view = this.createChildView(model);
            this.append(view);
        }
    });

    /**
     * Title view.
     * @constructor
     * @param {Object} options
     *   model: {PlayerState} model (required)
     */
    var PlayerTitleView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.template =  _.template(title_template);
            this.listenTo(this.model, 'change:chatMinute', this.render);
        },

        render: function() {
            var rootMinute, activeMinute;
            var context = {
                title: '',
                chat: null,
                hasArchive: false
            };

            if(!this.model.isEmpty()) {
                context.title = this.model.chat().get_topic().get_title();
                context.chat = this.model.chat().toJSON();
                context.hasArchive = this.model.hasArchive();
            } else {
                context.title = 'Select a chat for playback';
            }
            
            this.$el.html(this.template(context));
            return this;
        }
    });

    /**
     * Player button view.
     * @constructor
     * @param {Object} options
     *   model: {PlayerState} model (required)
     */
    var PlayerButtonView = core.view.View.extend({

        events: {
            'click .play': 'onPlay',
            'click .pause': 'onPause'
        },

        initialize: function(options) {
            this.template = _.template(button_template);
            this.listenTo(this.model, 'change:state', this.render);
        },

        render: function() {
            var context = this.model.toJSON({withRelated: true});
            this.$el.html(this.template(context));
            return this;
        },

        onPlay: function(e) {
            if(!this.model.isPlaying()) {
                this.triggerEvent(EVENTS.PLAY);
            }
        },

        onPause: function(e) {
            if(!this.model.isEmpty()) {
                this.triggerEvent(EVENTS.PAUSE);
            }
        }
    });

    /**
     * SoundManagerView.
     * @constructor
     * @param {Object} options
     *   model: {PlayerState} model (required)
     *
     * Note that soundmanager position and to/from only works 
     * reliably for mp3s at the moment. As a result this view
     * should only be used with mp3s and not mp4s.
     */
    var SoundManagerView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.archive = null;
            this.sound = null;
            this.startOffset = 0;
        },

        render: function() {
            return this;
        },

        load: function(archives, offset) {
            var that = this;
            var archive = archives.find(function(archive) {
                return archive.get_mime_type() === 'audio/mpeg3';
            });
            this.archives = archives;
            this.startOffset = offset;

            if(this.sound) {
                this.sound.stop();
                this.sound.destruct();
            }
            this.sound = soundManager.createSound({
                id: 'sound' + archive.id,
                url: archive.get_url(),
                autoLoad: true,
                autoPlay: false,
                onfinish: function() {
                    that.triggerEvent(EVENTS.FINISHED);
                }
            });
        },

        offset: function() {
            var result = 0;
            if(this.sound) {
                result = this.sound.position / 1000.0;
            }
            return result;
        },

        buffered: function() {
            var result = 0;
            if(this.sound && this.sound.buffered && this.sound.buffered.length) {
                result = this.sound.buffered[0].end / 1000.0;
            }
            return result;
        },

        duration: function() {
            var result = 0;
            if(this.sound) {
                result = this.sound.duration / 1000.0;
            }
            return result;
        },

        play: function(archives, offset) {
            offset = _.isNumber(offset) ? offset : this.startOffset;
            if(archives) {
                this.load(archives, offset);
            }
            this.sound.play({
                position: offset * 1000.0
            });
        },

        pause: function() {
            this.sound.pause();
        },

        resume: function() {
            this.sound.resume();
        },

        seek: function(offset) {
            this.sound.setPosition(offset * 1000.0);
        },

        stop: function() {
            this.sound.stop();
        }
    });

    /**
     * SoundManagerStreamingView.
     * @constructor
     * @param {Object} options
     *   model: {PlayerState} model (required)
     *
     * Note that the Rackspace CDN only works with mp4s.
     * As a result this view can only be used with mp4s.
     */
    var SoundManagerStreamingView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.archives = null;
            this.startOffset = 0;
            this.sound = null;
        },

        render: function() {
            return this;
        },

        load: function(archives, offset) {
            var that = this;
            var archive = archives.find(function(archive) {
                return archive.get_mime_type() === 'video/mp4';
            });
            this.archives = archives;

            if(this.sound) {
                //bug in sm, if play() is not called prior to destruct()
                //sound will continue to download in background
                this.sound.play();
                this.sound.stop();
                this.sound.destruct();
            }

            this.startOffset = offset;
            this.sound = soundManager.createSound({
                id: 'sound' + archive.id,
                url: archive.get_streaming_url() + '?seek=' + offset,
                autoLoad: true,
                autoPlay: false,
                onfinish: function() {
                    that.triggerEvent(EVENTS.FINISHED);
                }
            });
        },

        offset: function() {
            var result = 0;
            if(this.sound) {
                result = this.startOffset + (this.sound.position / 1000.0);
            }
            return result;
        },

        buffered: function() {
            return this.duration();
        },

        duration: function() {
            var result = 0;
            if(this.sound) {
                result = this.sound.duration / 1000.0;
            }
            return result;
        },

        play: function(archives, offset) {
            if(archives) {
                this.load(archives, offset);
            }

            this.sound.play();
        },

        pause: function() {
            this.sound.pause();
        },

        resume: function() {
            this.sound.resume();
        },

        seek: function(offset) {
            if(!this.model.isStopped()) {
                this.sound.stop();
                this.load(this.archives, offset);
                if(this.model.isPlaying()) {
                    this.sound.play();
                }
            }
        },

        stop: function() {
            this.sound.stop();
        }
    });

    /**
     * FlowplayerView.
     * @constructor
     * @param {Object} options
     *   model: {PlayerState} model (required)
     */
    var FlowplayerView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.api = null;
        },

        render: function() {
            return this;
        },

        load: function(archives, offset) {
            var that = this;
            var archive = archives.find(function(archive) {
                return archive.get_mime_type() === 'video/mp4';
            });
            var url = archive.get_streaming_url();

            this.$el.flowplayer({
                src: '/static/js/3ps/flowplayer/flowplayer-v3.2.11.swf'
            }, {

                plugins: {
                    akamai: {
                        url: '/static/js/3ps/flowplayer/AkamaiFlowPlugin.swf',
                        subClip: {clipBegin: offset},
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
                    url: url
                }

            });
            
            this.api = flowplayer();
            this.api.onFinish(function() {
                that.triggerEvent(EVENTS.FINISHED);
            });
        },

        offset: function() {
            return this.api ? this.api.getTime() : 0;
        },

        buffered: function() {
            return this.duration();
        },

        duration: function() {
            return this.api ? this.api.getClip().duration : 0;
        },

        play: function(archives, offset) {
            if(archives) {
                this.load(archives, offset);
            }
            if(this.api) {
                this.api.play();
            }
        },

        pause: function() {
            if(this.api) {
                this.api.pause();
            }
        },

        resume: function() {
            if(this.api) {
                this.api.resume();
            }
        },

        seek: function(offset) {
            if(this.api) {
                this.api.seek(offset);
            }
        },

        stop: function() {
            if(this.api) {
                this.api.stop();
            }
        }
    });

    /**
     * Player view.
     * @constructor
     * @param {Object} options
     *   model: {PlayerState} model (requried)
     */
    var PlayerView = core.view.View.extend({

        events: {
            'PLAY_EVENT': 'onPlay',
            'PAUSE_EVENT': 'onPause',
            'SEEK_EVENT': 'onSeek',
            'FINISHED_EVENT': 'onFinished'
        },

        childViews: function() {
            return [
                this.titleView,
                this.timerView,
                this.usersView,
                this.buttonView,
                this.scrubberView,
                this.playerView
            ];
        },

        initChildViews: function() {
            this.usersView = new PlayerUsersView({
                model: this.model
            });
            this.buttonView = new PlayerButtonView({
                model: this.model
            });
            this.timerView = new PlayerTimerView({
                model: this.model
            });
            this.titleView = new PlayerTitleView({
                model: this.model
            });
            this.scrubberView = new PlayerScrubberView({
                model: this.model
            });
            /*
            this.playerView = new FlowplayerView({
                model: this.model
            });
            */
            this.playerView = new SoundManagerView({
                model: this.model
            });
        },

        initialize: function(options) {
            this.template =  _.template(player_template);
            this.playerView = null;
            this.titleView = null;
            this.buttonView = null;
            this.scrubberView = null;
            this.timerView = null;
            this.usersView = null;
            this.progressTimerId = null;

            //child views
            this.initChildViews();
        },

        startProgressTimer: function(interval) {
            var that = this;
            interval = interval || 1000;
            
            if(!this.progressTimerId) {
                this.progressTimerId = setInterval(function() {
                    var offset = that.playerView.offset();
                    var buffered = that.playerView.buffered();

                    if(_.isNumber(offset) && offset > 0) {
                        that.model.set({
                            offset: offset,
                            buffered: buffered
                        });
                    }
                }, interval);
            }
        },

        stopProgressTimer: function() {
            if(this.progressTimerId) {
                clearInterval(this.progressTimerId);
                this.progressTimerId = null;
            }
        },

        load: function(callback, chat, offset) {
            var state, result=true;
            
            if(!chat.isLoading()) {
                state = chat.isLoadedWith('users', 'topic', 'archives');
                if(!state.loaded) {
                    result = false;
                    state.fetcher.fetch({
                        success: _.bind(callback, this, chat, offset)
                    });
                }
            }
            
            return result;
        },

        render: function() {
            var context = this.model.toJSON({withRelated: true});
            this.$el.html(this.template(context));

            this.assign(this.usersView, '.player-users');
            this.assign(this.buttonView, '.player-button');
            this.assign(this.timerView, '.player-timer');
            this.assign(this.titleView, '.player-title');
            this.assign(this.scrubberView, '.player-scrubber');
            this.assign(this.playerView, '.player-component');
            return this;
        },

        getArchive: function(chat) {
            var result = null;
            var archives = chat.get_archives();
            if(archives.length) {
                result = archives.first();
            }
            return result;
        },

        loadPlayer: function(chat, offset) {
            var duration = 0;
            var archive = this.getArchive(chat);

            if(archive) {
                if(!_.isNumber(offset)) {
                    offset = 0;
                }
                duration = archive.get_length() / 1000.0;
            }

            //stop progress timer
            this.stopProgressTimer();
            
            if(archive) {
                this.playerView.load(chat.get_archives(), offset);
            } else if(this.model.isPlaying()) {
                this.playerView.stop();
            }

            var users = this.model.users();
            users.reset(chat.get_users().map(function(user) {
                return new player_models.PlayerUser({
                    user: user
                    });
            }));

            this.model.set({
                chat: chat,
                archive: archive,
                offset: offset,
                duration: duration,
                users: users,
                state: this.model.STATE.STOPPED
            });
        },

        play: function(chat, offset) {
            var loaded = this.load(this.play, chat, offset);
            if(!loaded) {
                return;
            }
            
            this.loadPlayer(chat, offset);

            if(!this.model.hasArchive()) {
                return;
            }

            this.model.set({
                state: this.model.STATE.PLAYING
            });

            this.startProgressTimer();
            this.playerView.play();
        },

        pause: function() {
            if(this.model.isPlaying()) {
                this.stopProgressTimer();
                this.playerView.pause();
                this.model.set({
                    state: this.model.STATE.PAUSED
                });
            }
        },

        resume: function() {
            if(this.model.isPaused()) {
                this.startProgressTimer();
                this.playerView.resume();
                this.model.set({
                    state: this.model.STATE.PLAYING
                });
            }
        },

        seek: function(offset) {
            this.playerView.seek(offset);

            if(this.model.isPlaying()) {
                this.stopProgressTimer();
            }

            this.model.set({
                offset: offset
            });

            if(this.model.isPlaying()) {
                this.startProgressTimer();
            }
        },

        stop: function() {
            if(this.model.isPlaying()) {
                this.stopProgressTimer();
                this.playerView.stop();
                this.model.set({
                    state: this.model.STATE.STOPPED
                });
            }
        },

        onPlay: function(e) {
            var offset;
            if(this.model.isPaused()) {
                this.resume();
            } else if(this.model.isStopped()) {
                if(this.model.offset() >= this.model.duration()) {
                    offset = 0;
                } else {
                    offset = this.model.offset();
                }
                this.play(this.model.chat(), offset);
            }
        },

        onPause: function(e) {
            this.pause();
        },

        onSeek: function(e, eventBody) {
            var offset = eventBody.offset;
            this.seek(offset);
        },

        onFinished: function(e) {
            this.stopProgressTimer();
            this.model.set({
                state: this.model.STATE.STOPPED,
                offset: this.playerView.duration()
            });
        }

    });

    return {
        EVENTS: EVENTS,
        PlayerView: PlayerView
    };
});
