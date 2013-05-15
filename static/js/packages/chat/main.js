define(/** @exports alert */[
    'core',
    './chat/mediators',
    './chat/views',
    './tlkpt/views',
    './topic/mediators',
    './topic/views'
], function(
    core,
    chat_mediators,
    chat_views,
    tlkpt_views,
    topic_mediators,
    topic_views) {
    
    var register = function(facade) {
        facade.registerMediator(new chat_mediators.ChatMediator());
        facade.registerMediator(new topic_mediators.TopicMediator());
    };

    core.facade.register(register);
    
    return {
        mediators: {
            chat: chat_mediators,
            topic: topic_mediators
        },
        views: {
            chat: chat_views,
            tlkpt: tlkpt_views,
            topic: topic_views
        }
    };
});
