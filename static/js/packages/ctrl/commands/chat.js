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
                this.onError("max participants exceeded");
                return;
            }

            this.participant = new api.models.ChatParticipant({
                user_id: this.currentUser.id,
                chat_id: this.model.id
            });
            this.participant.save(null, {
                success: _.bind(this.createCredential, this),
                error: _.bind(this.onError, this, "max pariticpants exceeded")
            });
        },

        createCredential: function() {
            this.credential = new api.models.ChatCredential({
                chat_id: this.model.id
            });
            this.credential.save(null, {
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this, "chat unavailable")
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
         * Execute command
         * @param {object} options Options object
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

    return {
        ParticipateInChat: ParticipateInChat,
        UpdateTalkingPoints: UpdateTalkingPoints
    };
});
