define(/** @exports search */[
    'core',
    './mediators',
    './views'
], function(
    core,
    mediators,
    views) {
    
    var register = function(facade) {
        facade.registerMediator(new mediators.SearchMediator());
    };

    core.facade.register(register);

    return {
        mediators: mediators,
        views: views
    };
});
