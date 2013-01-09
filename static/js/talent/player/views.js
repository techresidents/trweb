define([
    'jquery',
    //'jquery.flowplayer',
    'underscore',
    'soundmanager/core',
    'core/view',
    'talent/player/scheduler',
    'talent/player/models',
    'timer/util',
    'text!talent/player/templates/button.html',
    'text!talent/player/templates/player.html',
    'text!talent/player/templates/scrubber.html',
    'text!talent/player/templates/timer.html',
    'text!talent/player/templates/title.html',
    'text!talent/player/templates/user.html',
    'text!talent/player/templates/users.html'
], function(
    $,
    //none,
    _,
    soundManager,
    view,
    scheduler,
    player_models,
    timer_util,
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
    var PlayerTimerView = view.View.extend({

        initialize: function(options) {
            this.template =  _.template(timer_template);
            this.model.bind('change:offset', this.render, this);
        },

        render: function() {
            var remaining = this.model.duration() - this.model.offset();
            if(_.isNaN(remaining)) {
                remaining = 0;
            }
            var timer = timer_util.formatTimer(remaining * -1000.0);
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
    var PlayerScrubberView = view.View.extend({

        events: {
            'click .player-scrubber-container': 'onClick',
            'mousemove .player-scrubber-container': 'onMouseMove',
            'mouseleave .player-scrubber-container': 'onMouseLeave'
        },

        initialize: function(options) {
            this.template =  _.template(scrubber_template);
            this.timerId = null;
            this.progress = 0;

            this.model.bind('change:chatSession', this.render, this);
            this.model.bind('change:offset', this.offsetChanged, this);
            this.model.bind('change:buffered', this.bufferedChanged, this);
        },

        render: function() {
            var context = {};
            var waveformUrl;
            var archive = this.model.archive();
            if(archive && archive.get_waveform_url()) {
                waveformUrl = archive.get_waveform_url();
            } else {
                waveformUrl = '/static/img/waveform.png';
            }
            this.$el.html(this.template(context));
            this.$('.player-scrubber-waveform').css('background-image', 'url(' + waveformUrl + ')');
            this.$('.player-scrubber-tracker').hide();
            return this;
        },

        offsetChanged: function() {
            var width = (this.model.offset() / this.model.duration()) * 100;
            this.$('.player-scrubber-progress').animate({width: width + '%'});
        },

        bufferedChanged: function() {
            var width = (this.model.buffered() / this.model.duration()) * 100;
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
        }
    });

    /**
     * Player user view.
     * @constructor
     * @param {Object} options
     *   model: {PlayerUser} model (required)
     */
    var PlayerUserView = view.View.extend({

        initialize: function(options) {
            this.template = _.template(user_template);
            this.model.bind('change', this.render, this);
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
    var PlayerUsersView = view.View.extend({
        initialize: function(options) {
            this.template =  _.template(users_template);
            this.model.bind('change', this.render, this);
            this.collection = this.model.users();
            this.childViews = [];
        },

        bindUsersEvents: function(collection) {
            collection.bind('reset', this.render, this);
            collection.bind('add', this.added, this);
        },

        render: function() {
            var collection = this.model.users();
            if(collection !== this.collection) {
                this.collection = collection;

                _.each(this.childViews, function(view) {
                    view.destroy();
                });

                this.childViews = [];
                this.bindUsersEvents(collection);
                var context = this.model.toJSON({withRelated: true});
                this.$el.html(this.template(context));
                this.collection.each(this.added, this);
            }
                
            return this;
        },

        added: function(model) {
            var view = new PlayerUserView({
                model: model
            }).render();

            this.childViews.push(view);

            this.$el.append(view.el);
        }
    });

    /**
     * Title view.
     * @constructor
     * @param {Object} options
     *   model: {PlayerState} model (required)
     */
    var PlayerTitleView = view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.template =  _.template(title_template);

            this.model.bind('change:chatMinute', this.render, this);
        },

        render: function() {
            var rootMinute, activeMinute;
            var context = {
                title: '',
                chatSession: null
            };

            if(!this.model.isEmpty()) {
                rootMinute = this.model.chatSession().get_chat_minutes().first();
                activeMinute = this.model.chatMinute();
                if(rootMinute.id !== activeMinute.id) {
                    context.title = rootMinute.get_topic().get_title()
                        + ' - ' +  activeMinute.get_topic().get_title();
                } else {
                    context.title = activeMinute.get_topic().get_title();
                }
                context.chatSession = this.model.chatSession().toJSON();
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
    var PlayerButtonView = view.View.extend({

        events: {
            'click .play': 'onPlay',
            'click .pause': 'onPause'
        },

        initialize: function(options) {
            this.template = _.template(button_template);
            this.model.bind('change:state', this.render, this);
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
     */
    var SoundManagerView = view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.archive = null;
            this.startOffset = 0;
            this.sound = null;
        },

        render: function() {
            return this;
        },

        load: function(archive, offset) {
            var that = this;
            this.archive = archive;

            if(this.sound) {
                //bug in sm, if play() is not called prior to destruct()
                //sound will continue to download in background
                this.sound.play();
                this.sound.stop();
                this.sound.destruct();
            }

            this.startOffset = offset;
            this.sound = soundManager.createSound({
                id: 'sound'+_.uniqueId(),
                url: archive.get_streaming_url() + '?seek=' + offset,
                autoLoad: true,
                autoPlay: false,
                onfinish: function() {
                    that.triggerEvent(EVENTS.FINISHED);
                }
            });
        },

        offset: function() {
            return this.startOffset + (this.sound.position / 1000.0);
        },

        buffered: function() {
            return this.duration();
        },

        duration: function() {
            return this.sound.duration / 1000.0;
        },

        play: function(archive, offset) {
            if(archive) {
                this.load(archive, offset);
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
                this.load(this.archive, offset);
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
    var FlowplayerView = view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.api = null;
        },

        render: function() {
            return this;
        },

        load: function(archive, offset) {
            var that = this;
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

        play: function(archive, offset) {
            if(archive) {
                this.load(archive, offset);
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
    var PlayerView = view.View.extend({

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

        initialize: function(options) {
            this.template =  _.template(player_template);
            this.playerView = null;
            this.titleView = null;
            this.buttonView = null;
            this.scrubberView = null;
            this.timerView = null;
            this.usersView = null;
            this.scheduler = null;
            this.progressTimerId = null;
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
                            buffered: buffered,
                            duration: that.playerView.duration()
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

        load: function(callback, chatSession, chatMinute, offset) {
            var state, result=true;
            
            if(!chatSession.isLoading()) {
                state = chatSession.isLoadedWith('users', 'chat_minutes__topic', 'speaking_markers', 'archives');
                if(!state.loaded) {
                    result = false;
                    state.fetcher({
                        success: _.bind(callback, this, chatSession, chatMinute, offset)
                    });
                }
            }
            
            if(chatMinute && !chatMinute.isLoading() && !chatMinute.isLoaded()) {
                result = false;
                chatMinute.fetch({
                    success: _.bind(this.play, this, chatSession, chatMinute)
                });
            }
            
            return result;
        },

        render: function() {
            var context = this.model.toJSON({withRelated: true});
            this.$el.html(this.template(context));

            this.usersView = new PlayerUsersView({
                el: this.$('.player-users'),
                model: this.model
            }).render();

            this.buttonView = new PlayerButtonView({
                el: this.$('.player-button'),
                model: this.model
            }).render();

            this.timerView = new PlayerTimerView({
                el: this.$('.player-timer'),
                model: this.model
            }).render();
            
            this.titleView = new PlayerTitleView({
                el: this.$('.player-title'),
                model: this.model
            }).render();

            this.scrubberView = new PlayerScrubberView({
                el: this.$('.player-scrubber'),
                model: this.model
            }).render();
            
            /*
            this.playerView = new FlowplayerView({
                el: this.$('.player-component'),
                model: this.model
            });
            */
            
            this.playerView = new SoundManagerView({
                el: this.$('.player-component'),
                model: this.model
            });

            return this;
        },

        getArchive: function(chatSession) {
            var result = null;
            var archives = chatSession.get_archives();
            if(archives.length) {
                result = archives.first();
            }
            return result;
        },

        computeOffset: function(chatSession, timestamp) {
            var archive = this.getArchive(chatSession);
            return timestamp - chatSession.get_publish() - archive.get_offset();
        },
        
        scheduleEvents: function(chatSession, scheduler) {
            var that = this;
            var archive = this.getArchive(chatSession);

            //schedule chat minute change events
            chatSession.get_chat_minutes().each(function(minute) {
                var offset = that.computeOffset(chatSession, minute.get_start());
                if (offset < 0) {
                    offset = 0;
                }
                that.scheduler.add(offset, function() {
                    that.model.set({
                        chatMinute: minute
                    });
                });

            });
            
            //schedule speaking marker events
            chatSession.get_speaking_markers().each(function(marker) {
                var start = that.computeOffset(chatSession, marker.get_start());
                var end = that.computeOffset(chatSession, marker.get_end());
                that.scheduler.add(start, function() {
                    var user = that.model.users().find(function(u) {
                        return u.user().id === marker.get_user_id();

                    });
                    user.set({isSpeaking: true});
                });
                that.scheduler.add(end, function() {
                    var user = that.model.users().find(function(u) {
                        return u.user().id === marker.get_user_id();

                    });
                    user.set({isSpeaking: false});
                });
            });
        },
        
        loadPlayer: function(chatSession, chatMinute, offset) {
            var archive;
            var loaded = this.load(this.loadPlayer, chatSession, chatMinute, offset);
            if(!loaded) {
                return;
            }

            if(!chatMinute) {
                chatMinute = chatSession.get_chat_minutes().first();
            }

            archive = this.getArchive(chatSession);
            if(!_.isNumber(offset)) {
                offset = this.computeOffset(chatSession, chatMinute.get_start());
                offset /= 1000.0;
                if(offset < 0) {
                    offset = 0;
                }
            }

            //stop scheduler if it exists
            if(this.scheduler) {
                this.scheduler.stop();
            }
            
            //stop progress timer
            this.stopProgressTimer();

            this.playerView.load(archive, offset);

            var users = new player_models.PlayerUserCollection();
            users.reset(chatSession.get_users().map(function(user) {
                return new player_models.PlayerUser({
                    user: user,
                    isSpeaking: false
                    });
            }));

            this.model.set({
                chatSession: chatSession,
                chatMinute: chatMinute,
                archive: archive,
                offset: offset,
                duration: archive.get_length() / 1000.0,
                users: users,
                state: this.model.STATE.STOPPED
            });
        },

        play: function(chatSession, chatMinute, offset) {
            var archive;
            var loaded = this.load(this.play, chatSession, chatMinute, offset);
            if(!loaded) {
                return;
            }

            this.loadPlayer(chatSession, chatMinute, offset);

            this.model.set({
                state: this.model.STATE.PLAYING
            });

            this.scheduler = new scheduler.Scheduler({
                clock: new scheduler.PlayerClock({
                    player: this.playerView
                })
            });
            this.scheduleEvents(chatSession, scheduler);
            this.scheduler.start(offset * 1000.0);

            this.startProgressTimer();
            this.playerView.play();
        },

        pause: function() {
            if(this.model.isPlaying()) {
                this.stopProgressTimer();
                this.scheduler.pause();
                this.playerView.pause();
                this.model.set({
                    state: this.model.STATE.PAUSED
                });
            }
        },

        resume: function() {
            if(this.model.isPaused()) {
                this.startProgressTimer();
                this.scheduler.resume();
                this.playerView.resume();
                this.model.set({
                    state: this.model.STATE.PLAYING
                });
            }
        },

        seek: function(offset) {
            var activeMinutes, activeMinute;
            var minutes = this.model.chatSession().get_chat_minutes();
            
            this.playerView.seek(offset);
            
            if(this.model.isPlaying()) {
                this.scheduler.stop();
                this.scheduler.start(offset * 1000);
            }

            activeMinutes = minutes.filter(function(minute) {
                var start = this.computeOffset(this.model.chatSession(), minute.get_start());
                var end = this.computeOffset(this.model.chatSession(), minute.get_end());
                var time = offset * 1000;
                return time >= start && time <= end;
            }, this);

            if(activeMinutes.length) {
                activeMinute = _.last(activeMinutes);
            } else {
                activeMinute = minutes.first();
            }
            
            this.model.set({
                chatMinute: activeMinute,
                offset: offset
            });
        },

        stop: function() {
            if(this.model.isPlaying()) {
                this.stopProgressTimer();
                this.scheduler.stop();
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
                if(this.model.offset() === this.model.duration()) {
                    offset = 0;
                } else {
                    offset = this.model.offset();
                }
                this.play(this.model.chatSession(), null, offset);
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
            var minutes = this.model.chatSession().get_chat_minutes();
            this.stopProgressTimer();
            this.scheduler.stop();
            this.model.set({
                chatMinute: minutes.first(),
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
