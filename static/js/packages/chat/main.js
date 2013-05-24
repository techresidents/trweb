define(/** @exports alert */[
    'core',
    './chat/mediators',
    './chat/views',
    './tlkpt/mediators',
    './tlkpt/views',
    './topic/mediators',
    './topic/views'
], function(
    core,
    chat_mediators,
    chat_views,
    tlkpt_mediators,
    tlkpt_views,
    topic_mediators,
    topic_views) {
    
    var register = function(facade) {
        facade.registerMediator(new chat_mediators.ChatMediator());
        facade.registerMediator(new topic_mediators.TopicMediator());
        facade.registerMediator(new tlkpt_mediators.TalkingPointsMediator());
    };

    core.facade.register(register);
    
    return {
        mediators: {
            chat: chat_mediators,
            topic: topic_mediators,
            tlkpt: tlkpt_mediators
        },
        views: {
            chat: chat_views,
            topic: topic_views,
            tlkpt: tlkpt_views
        }
    };
});
