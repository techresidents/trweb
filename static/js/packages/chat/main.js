define(/** @exports alert */[
    'core',
    './chat/mediators',
    './chat/views',
    './playback/mediators',
    './playback/views',
    './tlkpt/mediators',
    './tlkpt/views',
    './topic/mediators',
    './topic/views',
    './topicsearch/mediators',
    './topicsearch/views'
], function(
    core,
    chat_mediators,
    chat_views,
    playback_mediators,
    playback_views,
    tlkpt_mediators,
    tlkpt_views,
    topic_mediators,
    topic_views,
    topicsearch_mediators,
    topicsearch_views) {
    
    var register = function(facade) {
        facade.registerMediator(new chat_mediators.ChatMediator());
        facade.registerMediator(new playback_mediators.PlaybackMediator());
        facade.registerMediator(new topic_mediators.TopicMediator());
        facade.registerMediator(new tlkpt_mediators.TalkingPointsMediator());
        facade.registerMediator(new topicsearch_mediators.TopicSearchMediator());
    };

    core.facade.register(register);
    
    return {
        mediators: {
            chat: chat_mediators,
            playback: playback_mediators,
            topic: topic_mediators,
            tlkpt: tlkpt_mediators,
            topicsearch: topicsearch_mediators
        },
        views: {
            chat: chat_views,
            playback: playback_views,
            topic: topic_views,
            tlkpt: tlkpt_views,
            topicsearch: topicsearch_views
        }
    };
});
