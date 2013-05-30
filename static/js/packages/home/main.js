define(/** @exports alert */[
    'core',
    './developer/mediators',
    './developer/views'
], function(
    core,
    developer_mediators,
    developer_views) {

    var register = function(facade) {
        facade.registerMediator(new developer_mediators.DeveloperHomeMediator());
    };
    core.facade.register(register);

    return {
        mediators: {
            developer: developer_mediators
        },
        views: {
            developer: developer_views
        }
    };
});
