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
    
    var ChatConnectCommand = command.Command.extend({
        execute: function(options) {
            var chatProxy = this.facade.getProxy(chat_proxies.ChatProxy.NAME);
            chatProxy.connect();
            return true;
        }
    });
    
    var ChatStartCommand = command.Command.extend({
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

    var ChatEndCommand = command.Command.extend({
        execute: function(options) {
            //TODO
            return false;
        }
    });

    var ChatNextTopicCommand = command.Command.extend({
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
