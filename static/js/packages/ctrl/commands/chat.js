define([
    'underscore',
    'api',
    'core',
    'notifications',
    '../proxies/current'
], function(
    _,
    api,
    core,
    notifications,
    current_proxies) {

    /**
     * CreateChat constructor
     * @constructor
     * @classdesc
     * Create a chat
     */
    var CreateChat = core.command.AsyncCommand.extend({

        /**
         * Execute Command
         * @param {object} [options.model] Chat model to create.
         * This is not required if model attributes below are provided.
         * @param {string} [options.topic_id] Chat model topic_id.
         * This is not required if model is provided with attribute.
         * @param {string} [options.max_participants] Chat model max_participants value.
         * This is not required if model is provided with attribute.
         * @param {string} [options.max_duration] Chat model max_duration value.
         * This is not required if model is provided with attribute.
         * @param {function} [options.onSuccess] Success callback
         * @param {function} [options.onError] Error callback
         */
        execute: function(options) {
            var model = options.model || new api.models.Chat();

            // Set model attributes
            var attributes = _.defaults({
                topic_id: options.topic_id,
                max_participants: options.max_participants,
                max_duration: options.max_duration
            }, model.attributes);

            model.save(attributes, {
                wait: true,
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this)
            });

            return true;
        }
    });


    /**
     * ParticipateInChat constructor
     * @constructor
     * @classdesc
     * Participate in a chat.
     */
    var ParticipateInChat = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncSuccessCallbackArgs: ['model', 'credential'],

        asyncErrorCallbackArgs: ['model', 'fault'],

        /**
         * Execute command
         * @param {object} options Options object
         * @param {object} [options.model] Chat model to join.
         * This is not required if model attributes below  are provided.
         * @param {string} [options.chat_id] Chat model id.
         * This is not required if model is provided with attribute.
         * @param {function} [options.onSuccess] Success callback 
         * @param {function} [options.onError] Error callback 
         */
        execute: function(options) {
            this.currentProxy = this.facade.getProxy(
                current_proxies.CurrentProxy.NAME);
            this.currentUser = this.currentProxy.currentUser();
            this.model = options.model || new api.models.Chat({
                id: options.chat_id
            });
            this.loadChat();
        },

        loadChat: function() {
            var loader = new api.loader.ApiLoader([
                { instance: this.model, withRelated: ['chat_participants'] }
            ]);
            loader.load({
                triggerAlways: true,
                success: _.bind(this.onChatLoaded, this),
                error: _.bind(this.onError, this, "chat does not exist")
            });
        },

        onChatLoaded: function() {
            if(this.model.get_end()) {
                this.onError("chat is expired.");
                return;
            }
            var participants = this.model.get_chat_participants();
            if(!participants.where({ user_id: this.currentUser.id}).length) {
                this.createParticipant();
            } else {
                this.createCredential();
            }
        },

        createParticipant: function() {
            var current_participants = this.model.get_no_participants();
            var max_participants = this.model.get_max_participants();
            if(current_participants >= max_participants) {
                this.onError("maximum number of participants exceeded");
                return;
            }

            this.participant = new api.models.ChatParticipant({
                user_id: this.currentUser.id,
                chat_id: this.model.id
            });
            this.participant.save(null, {
                success: _.bind(this.createCredential, this),
                error: _.bind(this.onError, this, "maximum number of pariticpants exceeded")
            });
        },

        createCredential: function() {
            this.credential = new api.models.ChatCredential({
                chat_id: this.model.id
            });
            this.credential.save(null, {
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this, "chat is no longer available")
            });
        },

        onSuccess: function() {
            if(this.participant) {
                this.model.get_chat_participants().add(this.participant);
            }
            this.model.get_chat_credentials().add(this.credential);
            ParticipateInChat.__super__.onSuccess.call(this, this.model, this.credential);
        },

        onError: function(fault) {
            this.defaultErrorMessage = fault;
            ParticipateInChat.__super__.onError.call(this, this.model, fault);
        }
    });


    /**
     * UpdateTalkingPoints constructor
     * @constructor
     * @classdesc
     * Update the talking points collection.
     */
    var UpdateTalkingPoints = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['collection'],

        /**
         * Execute Command
         * @param {object} [options.collection] TalkingPointCollection
         * @param {function} [options.onSuccess] Success callback
         * @param {function} [options.onError] Error callback
         */
        execute: function(options) {
            var collection = options.collection;
            collection.save({
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this)
            });

            return true;
        }
    });


    /**
     * UpdateChatStatus constructor
     * @constructor
     * @classdesc
     * Update chat status.
     */
    var UpdateChatStatus = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute command
         * @param {object} options Options object
         * @param {string} options.chat Chat model which must
         *   contain credential model.
         * @param {string} options.status New chat status.
         * @param {function} [options.onSuccess] Success callback 
         * @param {function} [options.onError] Error callback 
         */
        execute: function(options) {
            var currentProxy = this.facade.getProxy(
                current_proxies.CurrentProxy.NAME);
            var currentUser = currentProxy.currentUser();
            var chat = options.chat;
            var credential = chat.get_chat_credentials().first();
            var timestamp = (new Date()).getTime() / 1000;

            if(!credential) {
                this.onError();
            }

            var message = new api.models.ChatMessage({
                header: {
                    type: 'CHAT_STATUS',
                    chat_token: credential.get_token(),
                    user_id: currentUser.id,
                    timestamp: timestamp
                },
                chat_status_message: {
                    user_id: currentUser.id,
                    status: options.status
                }
            });
            
            message.save(null, {
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this)
            });
        }
    });
            

    /**
     * UpdateChatUserStatus constructor
     * @constructor
     * @classdesc
     * Update chat user's status.
     */
    var UpdateChatUserStatus = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],


        /**
         * Execute command
         * @param {object} options Options object
         * @param {string} options.chat Chat model which must
         *   contain chat credential and participant models.
         * @param {string} options.status New user status.
         * @param {function} [options.onSuccess] Success callback 
         * @param {function} [options.onError] Error callback 
         */
        execute: function(options) {
            var currentProxy = this.facade.getProxy(
                current_proxies.CurrentProxy.NAME);
            var currentUser = currentProxy.currentUser();
            var chat = options.chat;
            var credential = chat.get_chat_credentials().first();
            var participant = _.first(chat.get_chat_participants().where({
                user_id: currentUser.id
            }));
            var timestamp = (new Date()).getTime() / 1000;

            var message = new api.models.ChatMessage({
                header: {
                    type: 'USER_STATUS',
                    chat_token: credential.get_token(),
                    user_id: currentUser.id,
                    timestamp: timestamp
                },
                user_status_message: {
                    user_id: currentUser.id,
                    status: options.status,
                    first_name: currentUser.get_first_name(),
                    participant: participant.get_participant()
                }
            });

            message.save(null, {
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this)
            });
            
        }
    });

    /**
     * AddChatToReel constructor
     * @constructor
     * @classdesc
     * Add chat to user's highlight reel
     */
    var AddChatToReel = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],


        /**
         * Execute command
         * @param {object} options Options object
         * @param {string} options.chat Chat model to add to reel.
         * @param {function} [options.onSuccess] Success callback 
         * @param {function} [options.onError] Error callback 
         */
        execute: function(options) {
            this.currentProxy = this.facade.getProxy(
                current_proxies.CurrentProxy.NAME);
            this.currentUser = this.currentProxy.currentUser();
            this.chat = options.chat;
            this.reels = this.currentUser.get_chat_reels();

            this.loadReels();

            return true;
        },

        loadReels: function() {
            this.reels.orderBy('rank__desc').fetch({
                success: _.bind(this.onReelsLoaded, this),
                error: _.bind(this.onError, this)
            });
        },

        onReelsLoaded: function() {
            var rank = 0;
            if(this.reels.length) {
                rank = this.reels.first().get_rank() + 1;
            }

            var reel = new api.models.ChatReel({
                chat_id: this.chat.id,
                user_id: this.currentUser.id,
                rank: rank
            });

            reel.save(null, {
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this)
            });
        }
    });

    /**
     * UpdateChatReel constructor
     * @constructor
     * @classdesc
     * Update the ChatReel collection.
     */
    var UpdateChatReel = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['collection'],

        /**
         * Execute command
         * @param {object} options Options object
         * @param {object} [options.collection] ChatReelCollection
         * @param {function} [options.onSuccess] Success callback
         * @param {function} [options.onError] Error callback
         */
        execute: function(options) {
            var collection = options.collection;
            collection.save({
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this)
            });

            return true;
        }
    });

    return {
        CreateChat: CreateChat,
        ParticipateInChat: ParticipateInChat,
        UpdateTalkingPoints: UpdateTalkingPoints,
        UpdateChatStatus: UpdateChatStatus,
        UpdateChatUserStatus: UpdateChatUserStatus,
        AddChatToReel: AddChatToReel,
        UpdateChatReel: UpdateChatReel
    };
});
