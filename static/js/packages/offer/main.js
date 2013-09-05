define(/** @exports alert */[
    'core',
    './employer/mediators',
    './employer/views'
], function(
    core,
    employer_mediators,
    employer_views) {

    var register = function(facade) {
        //facade.registerMediator(new developer_mediators.DeveloperHomeMediator());
        facade.registerMediator(new employer_mediators.EmployerOffersMediator());
    };
    core.facade.register(register);

    return {
        mediators: {
            //developer: developer_mediators,
            employer: employer_mediators
        },
        views: {
            //developer: developer_views,
            employer: employer_views
        }
    };
});
