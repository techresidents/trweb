define(/** @exports alert */[
    'core',
    './chat/mediators',
    './chat/views',
    './playback/mediators',
    './playback/views',
    './reel/mediators',
    './reel/views',
    './tlkpt/mediators',
    './tlkpt/views',
    './topic/mediators',
    './topic/views'
], function(
    core,
    chat_mediators,
    chat_views,
    playback_mediators,
    playback_views,
    reel_mediators,
    reel_views,
    tlkpt_mediators,
    tlkpt_views,
    topic_mediators,
    topic_views) {
    
    var register = function(facade) {
        facade.registerMediator(new chat_mediators.ChatMediator());
        facade.registerMediator(new playback_mediators.PlaybackMediator());
        facade.registerMediator(new reel_mediators.ChatReelMediator());
        facade.registerMediator(new topic_mediators.TopicMediator());
        facade.registerMediator(new tlkpt_mediators.TalkingPointsMediator());
    };

    core.facade.register(register);
    
    return {
        mediators: {
            chat: chat_mediators,
            playback: playback_mediators,
            reel: reel_mediators,
            topic: topic_mediators,
            tlkpt: tlkpt_mediators
        },
        views: {
            chat: chat_views,
            playback: playback_views,
            reel: reel_views,
            topic: topic_views,
            tlkpt: tlkpt_views
        }
    };
});
