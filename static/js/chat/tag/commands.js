define([
    'Underscore',
    'core/command',
    'chat/message/messages',
    'chat/message/models',
    'chat/minute/proxies',
    'chat/tag/models',
], function(
    _,
    command,
    messages,
    message_models,
    minute_proxies,
    tag_models) {
    
    var CreateTagCommand = command.AsyncCommand.extend({

        asyncCallbackArgs: ['model', 'response'],

        execute: function(options) {
            var minutesProxy = this.facade.getProxy(minute_proxies.ChatMinutesProxy.NAME);
            var activeMinute = minutesProxy.collection.active();

            if(activeMinute) {
                var tag = new tag_models.Tag({
                    name: options.name,
                    minuteId: activeMinute.id
                });

                var message = new message_models.ChatMessage({
                    header: new messages.MessageHeader(),
                    msg: new messages.TagCreateMessage(tag.attributes),
                });

                message.save(null, {
                    success: _.bind(this.onSuccess, this),
                    error: _.bind(this.onError, this),
                });
            }

            return true;
        },

    });

    var DeleteTagCommand = command.AsyncCommand.extend({

        asyncCallbackArgs: ['model', 'response'],

        execute: function(options) {
            var minutesProxy = this.facade.getProxy(minute_proxies.ChatMinutesProxy.NAME);
            var activeMinute = minutesProxy.collection.active();

            if(activeMinute) {

                var message = new message_models.ChatMessage({
                    header: new messages.MessageHeader(),
                    msg: new messages.TagDeleteMessage(options.model.attributes)
                });

                message.save(null, {
                    success: _.bind(this.onSuccess, this),
                    error: _.bind(this.onError, this),
                });
            }

            return true;
        }
    });

    return {
        CreateTagCommand: CreateTagCommand,
        DeleteTagCommand: DeleteTagCommand,
    };
});
