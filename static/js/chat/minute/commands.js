define([
    'Underscore',
    'core/command',
    'chat/message/messages',
    'chat/message/models',
    'chat/minute/models',
    'chat/minute/proxies',
], function(
    _,
    command,
    messages,
    message_models,
    minute_models,
    minute_proxies) {
    
    var StartMinuteCommand = command.AsyncCommand.extend({

        asyncCallbackArgs: ['model', 'response'],

        execute: function(options) {
            var message = new message_models.ChatMessage({
                header: new messages.MessageHeader(),
                msg: new messages.MinuteCreateMessage({
                    topicId: options.topicId,
                }),
            });

            message.save(null, {
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this),
            });

            return true;
        },

    });

    var EndMinuteCommand = command.AsyncCommand.extend({

        asyncCallbackArgs: ['model', 'response'],

        execute: function(options) {
            var minutesProxy = this.facade.getProxy(minute_proxies.ChatMinutesProxy.NAME);

            var minute;
            if(options.minuteId) {
                minute = minutesProxy.get(minuteId);
            } else {
                minute = options.minute;
            }

            if(minute) {
                var message = new message_models.ChatMessage({
                    header: new messages.MessageHeader(),
                    msg: new messages.MinuteUpdateMessage(minute.attributes),
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
        StartMinuteCommand: StartMinuteCommand,
        EndMinuteCommand: EndMinuteCommand,
    };
});
