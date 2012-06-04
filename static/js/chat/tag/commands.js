define([
    'Underscore',
    'core/command',
    'chat/minute/proxies',
    'chat/tag/models',
    'chat/tag/proxies',
], function(
    _,
    command,
    minute_proxies,
    tag_models,
    tag_proxies) {
    
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

                tag.save(null, {
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
                options.model.destroy(null, {
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
