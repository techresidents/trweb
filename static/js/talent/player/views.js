define([
    'jquery',
    'jquery.flowplayer',
    'underscore',
    'core/view',
    'talent/player/scheduler',
    'talent/player/models',
    'text!talent/player/templates/player.html',
    'text!talent/player/templates/title.html',
    'text!talent/player/templates/user.html',
    'text!talent/player/templates/users.html',
    'text!talent/player/templates/expand.html'
], function(
    $,
    none,
    _,
    view,
    scheduler,
    player_models,
    player_template,
    title_template,
    user_template,
    users_template,
    expand_template) {

    var EVENTS = {
    };

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
            this.flowplayerView = null;

            this.model.bind('change:chatMinute', this.render, this);
        },

        render: function() {
            var rootMinute, activeMinute;
            var context = {
                title: '',
                chatSession: null
            };

            if(this.model.state() !== this.model.STATE.EMPTY) {
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
     * Player expand view.
     * @constructor
     * @param {Object} options
     *   model: {PlayerState} model (required)
     */
    var PlayerExpandView = view.View.extend({

        initialize: function(options) {
            this.template = _.template(expand_template);
            this.model.bind('change', this.render, this);
        },

        render: function() {
            var context = this.model.toJSON({withRelated: true});
            this.$el.html(this.template(context));
            return this;
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
        },

        childViews: function() {
            return [this.titleView, this.usersView, this.expandView];
        },

        initialize: function(options) {
            this.template =  _.template(player_template);
            this.titleView = null;
            this.usersView = null;
            this.expandView = null;
            this.scheduler = null;
        },

        load: function(chatSession, chatMinute) {
            var state, result=true;
            
            if(!chatSession.isLoading()) {
                state = chatSession.isLoadedWith('users', 'chat_minutes__topic', 'speaking_markers', 'archives');
                if(!state.loaded) {
                    result = false;
                    state.fetcher({
                        success: _.bind(this.play, this, chatSession, chatMinute)
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
            
            this.titleView = new PlayerTitleView({
                el: this.$('.player-title'),
                model: this.model
            }).render();

            this.usersView = new PlayerUsersView({
                el: this.$('.player-users'),
                model: this.model
            }).render();

            this.$('.player-fp').flowplayer({
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
                }
            });
            
            /*
            this.expandView = new PlayerExpandView({
                el: this.$('.player-expand'),
                model: this.model
            }).render();
            */

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

        bindFlowplayerEvents: function(api) {
            api.onBegin(_.bind(this.onBegin, this));
            api.onPause(_.bind(this.onPause, this));
            api.onResume(_.bind(this.onResume, this));
            api.onSeek(_.bind(this.onSeek, this));
            api.onFinish(_.bind(this.onFinish, this));
        },

        scheduleEvents: function(chatSession, scheduler) {
            var that = this;
            var archive = this.getArchive(chatSession);

            //schedule chat minute change events
            chatSession.get_chat_minutes().each(function(minute) {
                var offset = that.computeOffset(chatSession, minute.get_start());
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

        onBegin: function(clip) {
            var plugin = this.api.getPlugin('akamai');
            this.scheduler.start(plugin.config.subClip.clipBegin * 1000);
            this.model.set({
                state: this.model.STATE.PLAYING
            });
        },
        
        onPause: function(clip) {
            this.scheduler.pause();
            this.model.set({
                state: this.model.STATE.PAUSED
            });
        },

        onResume: function(clip) {
            this.scheduler.resume();
            this.model.set({
                state: this.model.STATE.PLAYING
            });
        },

        onSeek: function(clip, time) {
            var activeMinutes, activeMinute;
            var minutes = this.model.chatSession().get_chat_minutes();

            this.scheduler.stop();
            this.scheduler.start(time * 1000);

            activeMinutes = minutes.filter(function(minute) {
                var start = this.computeOffset(this.model.chatSession(), minute.get_start());
                var end = this.computeOffset(this.model.chatSession(), minute.get_end());
                var offset = time * 1000;
                return offset >= start && offset <= end;
            }, this);

            if(activeMinutes.length) {
                activeMinute = _.last(activeMinutes);
            } else {
                activeMinute = minutes.first();
            }

            this.model.set({
                chatMinute: activeMinute
            });
        },

        onFinish: function(clip) {
            var minutes = this.model.chatSession().get_chat_minutes();
            this.scheduler.stop();
            this.model.set({
                chatMinute: minutes.first(),
                state: this.model.STATE.STOPPED
            });
        },

        play: function(chatSession, chatMinute) {
            var archive, offset;
            var loaded = this.load(chatSession, chatMinute);
            if(!loaded) {
                return;
            }

            if(!chatMinute) {
                chatMinute = chatSession.get_chat_minutes().first();
            }

            archive = this.getArchive(chatSession);
            offset = this.computeOffset(chatSession, chatMinute.get_start());
            if(offset < 0) {
                offset = 0;
            }

            this.$('.player-fp').flowplayer({
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
            
            //create scheduler and schedule playback events
            this.scheduler = new scheduler.Scheduler({
                clock: new scheduler.FlowplayerClock({
                    api: this.api
                })
            });
            this.scheduleEvents(chatSession, scheduler);

            this.bindFlowplayerEvents(this.api);
            this.api.play();
            
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
                users: users,
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
