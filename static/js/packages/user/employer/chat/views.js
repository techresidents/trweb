define([
    'jquery',
    'underscore',
    'core',
    'api',
    'ui',
    '../events',
    'text!./templates/chats.html',
    'text!./templates/chat.html'
], function(
    $,
    _,
    core,
    api,
    ui,
    user_events,
    chats_template,
    chat_template) {

    var UserChatView = core.view.View.extend({

        /**
         * Constructor
         * @constructs
         * @param {Object} options
         * @param {Chat} options.chat Chat model
         * @param {PlayerState} options.playerState Player state model
         */
        initialize: function(options) {
            this.playerState = options.playerState;
            this.template = _.template(chat_template);
            this.modelWithRelated = ['topic'];
            
            //bind events
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.playerState, 'change:state', this.render);

            this.loader = new api.loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated }
            ]);

            this.loader.load();
        },

        events: {
            'click .play': 'play'
        },
        
        render: function() {
            var duration = (this.model.get_end() - this.model.get_start()) / 1000;
            var context = {
                model: this.model.toJSON({ withRelated: this.modelWithRelated }),
                fmt: this.fmt,
                playing: this.isPlaying(),
                duration: duration
            };
            this.$el.html(this.template(context));
            return this;
        },

        isPlaying: function() {
            var result = false;
            var chat = this.playerState.chat();
            if(chat && chat.id === this.model.id) {
                result = this.playerState.state() === this.playerState.STATE.PLAYING;
            }
            return result;
        },

        play: function(e) {
            var eventBody = {
                chat: this.model
            };
            this.triggerEvent(user_events.PLAY_CHAT, eventBody);
        }
    });

    var UserChatReelsView = core.view.View.extend({

        /**
         * User chat reels view.
         * @constructs
         * @param {Object} options
         * @param {ChatReelCollection} options.collection 
         *   Chat reel collection
         * @param {PlayerState} options.playerState Player state model
         */
        initialize: function(options) {
            this.collection = options.collection;
            this.playerState = options.playerState;
            this.template =  _.template(chats_template);
            this.collectionWithRelated = ['chat__topic'];
            
            //bind events
            this.listenTo(this.collection, 'reset', this.onReset);
            this.listenTo(this.collection, 'add', this.onAdd);

            this.loader = new api.loader.ApiLoader([
                { instance: this.collection, withRelated: this.collectionWithRelated }
            ]);

            this.loader.load();

            //child views
            this.childViews = [];
            this.initChildViews();
        },

        events: {
        },

        chatsSelector: '.chats-container',

        initChildViews: function() {
            this.destroyChildViews();
            this.childViews = [];
            this.collection.each(this.createChildView, this);
        },

        render: function() {
            var context = {
                collection: this.collection.toJSON({
                    withRelated: this.collectionWithRelated
                })
            };
            this.$el.html(this.template(context));

            _.each(this.childViews, function(view) {
                this.append(view, this.chatsSelector);
            }, this);
            
            return this;
        },

        createChildView: function(model) {
            var view = new UserChatView({
                model: model.get_chat(),
                playerState: this.playerState
            });
            this.childViews.push(view);

            return view;
        },

        onReset: function() {
            this.initChildViews();
            this.render();
        },

        onAdd: function(model) {
            var view = this.createChildView(model);
            this.append(view, this.chatsSelector);
        }
    });

    return {
        UserChatReelsView: UserChatReelsView
    };
});
