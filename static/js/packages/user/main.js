define(/** @exports user */[
    'core',
    './mediators',
    './views'
], function(
    core,
    mediators,
    views) {
    
    var register = function(facade) {
        var mediator = new mediators.UserMediator();
        facade.registerMediator(mediator);
    };

    core.facade.register(register);

    return {
        mediators: mediators,
        views: views
    };
});
