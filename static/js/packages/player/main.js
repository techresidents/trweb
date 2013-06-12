define(/** @exports player */[
    'core',
    './mediators',
    './models',
    './scheduler',
    './views'
], function(
    core,
    mediators,
    models,
    scheduler,
    views) {

    var register = function(facade) {
        facade.registerMediator(new mediators.PlayerMediator());
    };

    core.facade.register(register);

    return {
        mediators: mediators,
        models: models,
        scheduler: scheduler,
        views: views
    };
});
