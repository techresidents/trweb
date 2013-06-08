define(/** @exports alert */[
    'core',
    './chat/mediators',
    './chat/views',
    './reel/mediators',
    './reel/views',
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
    reel_mediators,
    reel_views,
    tlkpt_mediators,
    tlkpt_views,
    topic_mediators,
    topic_views,
    topicsearch_mediators,
    topicsearch_views) {
    
    var register = function(facade) {
        facade.registerMediator(new chat_mediators.ChatMediator());
        facade.registerMediator(new reel_mediators.ChatReelMediator());
        facade.registerMediator(new topic_mediators.TopicMediator());
        facade.registerMediator(new tlkpt_mediators.TalkingPointsMediator());
        facade.registerMediator(new topicsearch_mediators.TopicSearchMediator());
    };

    core.facade.register(register);
    
    return {
        mediators: {
            chat: chat_mediators,
            reel: reel_mediators,
            topic: topic_mediators,
            tlkpt: tlkpt_mediators,
            topicsearch: topicsearch_mediators
        },
        views: {
            chat: chat_views,
            reel: reel_views,
            topic: topic_views,
            tlkpt: tlkpt_views,
            topicsearch: topicsearch_views
        }
    };
});
