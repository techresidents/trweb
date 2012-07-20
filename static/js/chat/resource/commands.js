define([
    'common/notifications',
    'core/command',
    'chat/resource/proxies'
], function(
    notifications,
    command,
    resource_proxies) {

    /**
     * Show Resource Command
     * @constructor
     *
     * Loads and shows the indicated resource.
     */
    var ShowResourceCommand = command.Command.extend({

        /**
         * Execute Command
         * @param {Object} options
         *   {integer} resourceId required if resource not provided
         *   {Resoure} resource required if resourceId not provided
         *   {function} onSuccess optional success callback
         *   {function} onError optional error callback
         *   {Object} context optional callback context
         *
         * @return {boolean} true on success, false otherwise.
         */
        execute: function(options) {
            var resourcesProxy = this.facade.getProxy(resource_proxies.ChatResourcesProxy.NAME);
            var resource = null;
            if(options.resourceId) {
                resource = resourcesProxy.get(options.resourceId);
            } else {
                resource = options.resource;
            }
            
            //show resources tab
            this.facade.trigger(notifications.SHOW_RESOURCES, {});

            //select the indicated resource
            this.facade.trigger(notifications.RESOURCE_SELECT, {
                resource: resource
            });

            return true;
        }
    });

    return {
        ShowResourceCommand: ShowResourceCommand
    };
});
