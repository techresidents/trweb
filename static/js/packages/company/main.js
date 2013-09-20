define(/** @exports alert */[
    'core',
    './employer/mediators',
    './employer/views'
], function(
    core,
    employer_mediators,
    employer_views) {

    var register = function(facade) {
        facade.registerMediator(
            new employer_mediators.CompanyProfileMediator()
        );
    };
    core.facade.register(register);

    return {
        mediators: {
            employer: employer_mediators
        },
        views: {
            employer: employer_views
        }
    };
});
