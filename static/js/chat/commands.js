define([
    'Underscore',
    'common/notifications',
    'core/command',
    'chat/proxies',
    'chat/agenda/proxies',
    'chat/minute/models',
    'chat/minute/proxies',
], function(
    _,
    notifications,
    command,
    chat_proxies,
    agenda_proxies) {

    /**
     * Chat Connect Command
     * @constructor
     *
     * Connect users in the chat and allow chat messages to flowing.
     * Note that the chat is not started until one of the users
     * explicitly starts it.
     */
    var ChatConnectCommand = command.Command.extend({

        /**
         * Execute command
         * @param {Object} options
         *   {function} onSuccess optional success callback
         *   {function} onError optional error callback
         *   {Object} context optional callback context
         *
         * @return {boolean} true on success, false otherwise.
         */
        execute: function(options) {
            var chatProxy = this.facade.getProxy(chat_proxies.ChatProxy.NAME);
            chatProxy.connect();
            return true;
        }
    });
    
    /**
     * Chat Start Command
     * @constructor
     *
     * Start the chat (conversation).
     */
    var ChatStartCommand = command.Command.extend({

        /**
         * Execute command
         * @param {Object} options
         *   {function} onSuccess optional success callback
         *   {function} onError optional error callback
         *   {Object} context optional callback context
         *
         * @return {boolean} true on success, false otherwise.
         */
        execute: function(options) {
            var result = false;
            this.chatProxy = this.facade.getProxy(chat_proxies.ChatProxy.NAME);

            if(!this.chatProxy.isActive()) {
                this.facade.trigger(notifications.CHAT_NEXT_TOPIC);
                result = true;
            }
            return result;
        }
    });

    /**
     * Chat End Command
     * @constructor
     *
     * End the chat (conversation).
     */
    var ChatEndCommand = command.Command.extend({

        /**
         * Execute command
         * @param {Object} options
         *   {function} onSuccess optional success callback
         *   {function} onError optional error callback
         *   {Object} context optional callback context
         *
         * @return {boolean} true on success, false otherwise.
         */
        execute: function(options) {
            //TODO
            return false;
        }
    });

    var ChatNextTopicCommand = command.Command.extend({

        /**
         * Execute command
         * @param {Object} options
         *   {function} onSuccess optional success callback
         *   {function} onError optional error callback
         *   {Object} context optional callback context
         *
         * @return {boolean} true on success, false otherwise.
         */
        execute: function(options) {
            this.agendaProxy = this.facade.getProxy(agenda_proxies.ChatAgendaProxy.NAME);
            this.agendaProxy.activateNext();
            return true;
        },


    });

    return {
        ChatConnectCommand: ChatConnectCommand,
        ChatStartCommand: ChatStartCommand,
        ChatEndCommand: ChatEndCommand,
        ChatNextTopicCommand: ChatNextTopicCommand,
    };
});
