define(/** @exports user */[
    'core',
    './employer/mediators'
], function(
    core,
    employer_mediators) {
    
    var register = function(facade) {
        facade.registerMediator(new employer_mediators.user.EmployerUserMediator());
    };

    core.facade.register(register);

    return {
        mediators: {
            employer: employer_mediators
        }
    };
});
