define(/** @exports alert */[
    'core',
    './list/mediators',
    './list/views',
    './req/mediators',
    './req/views'
], function(
    core,
    list_mediators,
    list_views,
    req_mediators,
    req_views) {
    
    var register = function(facade) {
        facade.registerMediator(new list_mediators.RequisitionListMediator());
        facade.registerMediator(new req_mediators.RequisitionMediator());
    };

    core.facade.register(register);

    return {
        mediators: {
            list: list_mediators,
            req: req_mediators
        },
        views: {
            list: list_views,
            req: req_views
        }
    };
});
