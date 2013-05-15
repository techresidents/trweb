define(/** @exports alert */[
    'core',
    './mediators',
    './models',
    './views'
], function(
    core,
    mediators,
    models,
    views) {
    
    var register = function(facade) {
        facade.registerMediator(new mediators.AlertMediator());
    };

    core.facade.register(register);

    return {
        mediators: mediators,
        models: models,
        views: views
    };
});
