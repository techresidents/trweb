define([
    'Underscore',
    'common/notifications',
    'core/mediator',
    'chat/resource/models',
    'chat/resource/proxies',
    'chat/resource/views',
], function(
    _,
    notifications,
    mediator,
    resource_models,
    resource_proxies,
    resource_views) {

    /**
     * Resources Tab Mediator
     * @constructor
     * @param {Object} options
     */
    var ResourcesTabMediator = mediator.Mediator.extend({
        name: function() {
            return ResourcesTabMediator.NAME;
        },
        
        /**
         * Notification handlers
         */
        notifications: [
            [notifications.RESOURCE_SELECT, 'onResourceSelect'],
        ],

        initialize: function(options) {
            this.resourcesProxy = this.facade.getProxy(resource_proxies.ChatResourcesProxy.NAME);
            
            //create view
            this.view = new resource_views.ChatResourcesTabView({
                model: new resource_models.ResourcesValueObject({
                    resources: this.resourcesProxy.collection,
                    selected: null,
                })
            });

            //add events listeners
            this.view.addEventListener(resource_views.EVENTS.SELECT, this.onSelect, this);

            //notify system of view creation
            this.facade.trigger(notifications.VIEW_CREATED, {
                type: 'ResourcesTabView',
                view: this.view
            });
        },

        onResourceSelect: function(notification) {
            this.view.model.select(notification.resource);
        },

        onSelect: function(e, eventBody) {
            this.view.model.select(eventBody.resourceModel);
        },


    }, {

        NAME: 'ResourcesTabMediator',
    });

    return {
        ResourcesTabMediator: ResourcesTabMediator,
    }
});
