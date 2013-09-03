define(/** @exports alert */[
    'core',
    './developer/mediators',
    './developer/views',
    './employer/mediators',
    './employer/views'
], function(
    core,
    developer_mediators,
    developer_views,
    employer_mediators,
    employer_views) {

    var register = function(facade) {
        facade.registerMediator(new developer_mediators.DeveloperOffersMediator());
        facade.registerMediator(new employer_mediators.EmployerOffersMediator());
    };
    core.facade.register(register);

    return {
        mediators: {
            developer: developer_mediators,
            employer: employer_mediators
        },
        views: {
            developer: developer_views,
            employer: employer_views
        }
    };
});
