define([
    'core/command',
    'chat/minute/proxies',
    'chat/tag/models',
    'chat/tag/proxies',
], function(
    command,
    minute_proxies,
    tag_models,
    tag_proxies) {
    
    var CreateTagCommand = command.Command.extend({
        execute: function(options) {
            var minutesProxy = this.facade.getProxy(minute_proxies.ChatMinutesProxy.NAME);
            var activeMinute = minutesProxy.collection.active();

            if(activeMinute) {
                var tag = new tag_models.Tag({
                    name: options.name,
                    minuteId: activeMinute.id
                });
                tag.save();
            }
        }
    });

    var DeleteTagCommand = command.Command.extend({
        execute: function(options) {
            var minutesProxy = this.facade.getProxy(minute_proxies.ChatMinutesProxy.NAME);
            var activeMinute = minutesProxy.collection.active();

            if(activeMinute) {
                options.model.destroy();
            }
        }
    });

    return {
        CreateTagCommand: CreateTagCommand,
        DeleteTagCommand: DeleteTagCommand,
    };
});
