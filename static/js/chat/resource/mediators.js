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


    var ResourcesTabMediator = mediator.Mediator.extend({
        name: function() {
            return ResourcesTabMediator.NAME;
        },

        notifications: [
        ],

        initialize: function(options) {
            this.resourcesProxy = this.facade.getProxy(resource_proxies.ChatResourcesProxy.NAME);

            this.view = new resource_views.ChatResourcesTabView({
                model: new resource_models.ResourcesValueObject({
                    resources: this.resourcesProxy.collection,
                    selected: null,
                })
            });

            //add events listeners
            this.view.addEventListener(resource_views.EVENTS.SELECT, this.onSelect, this);

            this.facade.trigger(notifications.VIEW_CREATED, 'ResourcesTabView', this.view);
        },

        onSelect: function(e, resourceModel) {
            this.view.model.select(resourceModel);
        },

    }, {

        NAME: 'ResourcesTabMediator',
    });

    return {
        ResourcesTabMediator: ResourcesTabMediator,
    }
});
