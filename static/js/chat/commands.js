define([
    'underscore',
    'common/notifications',
    'core/command',
    'chat/proxies',
    'chat/agenda/proxies',
    'chat/minute/models',
    'chat/minute/proxies'
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
            var chatProxy = this.facade.getProxy(chat_proxies.ChatProxy.NAME);

            if(!chatProxy.isActive()) {
                chatProxy.start();
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
            var chatProxy = this.facade.getProxy(chat_proxies.ChatProxy.NAME);

            if(chatProxy.isActive()) {
                chatProxy.end();
                result = true;
            } else {
                this.facade.trigger(notifications.SHOW_FEEDBACK);
            }
            return true;
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
            var chatProxy = this.facade.getProxy(chat_proxies.ChatProxy.NAME);
            var agendaProxy = this.facade.getProxy(agenda_proxies.ChatAgendaProxy.NAME);

            if(chatProxy.isActive()) {
                if(agendaProxy.nextActive()) {
                    agendaProxy.activateNext();
                } else {
                    this.facade.trigger(notifications.CHAT_END);
                }
            } else {
                this.facade.trigger(notifications.CHAT_START);
            }
            return true;
        }
    });

    /**
     * Chat Ended Command
     * @constructor
     */
    var ChatEndedCommand = command.Command.extend({

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

            //disconnect chat which will stop any recording in progress.
            chatProxy.disconnect();

            this.facade.trigger(notifications.SHOW_FEEDBACK);
            return true;
        }
    });

    return {
        ChatConnectCommand: ChatConnectCommand,
        ChatStartCommand: ChatStartCommand,
        ChatEndCommand: ChatEndCommand,
        ChatEndedCommand: ChatEndedCommand,
        ChatNextTopicCommand: ChatNextTopicCommand
    };
});
