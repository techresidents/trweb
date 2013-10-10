define(/** @exports hiring */[
    'core',
    './developer/mediators'
], function(
    core,
    developer_mediators) {
    
    var register = function(facade) {
        facade.registerMediator(new developer_mediators.event.DeveloperEventMediator());
    };

    core.facade.register(register);

    return {
        mediators: {
            developer: developer_mediators
        }
    };
});
