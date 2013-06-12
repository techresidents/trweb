define(/** @exports applicant */[
    'core',
    './mediators',
    './views'
], function(
    core,
    mediators,
    views) {
    
    var register = function(facade) {
        facade.registerMediator(new mediators.ApplicationMediator());
        facade.registerMediator(new mediators.OfferMediator());
        facade.registerMediator(new mediators.TrackerMediator());
    };

    core.facade.register(register);

    return {
        mediators: mediators,
        views: views
    };
});
