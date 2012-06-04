define([
    'Underscore',
    'core/command',
    'chat/minute/models',
    'chat/minute/proxies',
], function(
    _,
    command,
    minute_models,
    minute_proxies) {
    
    var StartMinuteCommand = command.AsyncCommand.extend({

        asyncCallbackArgs: ['model', 'response'],

        execute: function(options) {
            var minutesProxy = this.facade.getProxy(minute_proxies.ChatMinutesProxy.NAME);

            var minute = new minute_models.Minute({
                topicId: options.topicId,
            });

            minute.save(null, {
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
                minute.save(null, {
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
