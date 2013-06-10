define(/** @exports playback */[
    'core',
    './mediators',
    './views'
], function(
    core,
    mediators,
    views) {
    
    var register = function(facade) {
        facade.registerMediator(new mediators.PlaybackMediator());
    };

    core.facade.register(register);

    return {
        mediators: mediators,
        views: views
    };
});
