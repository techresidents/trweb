define([
    'jquery',
    'underscore',
    'api/models/location',
    'api/models/technology',
    'api/models/topic',
    'api/models/user',
    'api/models/chat',
    'api/models/chat_session',
    'api/models/archive',
    'api/models/skill',
    'api/models/position_pref'

], function(
    $,
    _,
    location_models,
    technology_models,
    topic_models,
    user_models,
    chat_models,
    chat_session_models,
    archive_models,
    skill_models,
    position_pref_models) {

    return {
        Location: location_models.Location,
        LocationCollection: location_models.LocationCollection,
        Technology: technology_models.Technology,
        TechnologyCollection: technology_models.TechnologyCollection,
        Topic: topic_models.Topic,
        TopicCollection: topic_models.TopicCollection,
        User: user_models.User,
        UserCollection: user_models.UserCollection,
        Chat: chat_models.Chat,
        ChatCollection: chat_models.ChatCollection,
        ChatSession: chat_session_models.ChatSession,
        ChatSessionCollection: chat_session_models.ChatSessionCollection,
        Archive: archive_models.Archive,
        ArchiveCollection: archive_models.ArchiveCollection,
        Skill: skill_models.Skill,
        SkillCollection: skill_models.SkillCollection,
        PositionPref: position_pref_models.PositionPref,
        PositinoPrefCollection: position_pref_models.PositionPrefCollection
    };
});
