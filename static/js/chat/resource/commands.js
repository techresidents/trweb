define([
    'common/notifications',
    'core/command',
    'chat/resource/proxies',
], function(
    notifications,
    command,
    resource_proxies) {
    
    var ShowResourceCommand = command.Command.extend({
        execute: function(options) {
            var resourcesProxy = this.facade.getProxy(resource_proxies.ChatResourcesProxy.NAME);
            var resource = null;
            if(options.resourceId) {
                resource = resourcesProxy.get(options.resourceId);
            } else {
                resource = options.resource;
            }

            this.facade.trigger(notifications.SHOW_RESOURCES, {});
            this.facade.trigger(notifications.RESOURCE_SELECT, {
                resource: resource,
            });

            return true;
        }
    });

    return {
        ShowResourceCommand: ShowResourceCommand,
    };
});
