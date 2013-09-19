define([
    'jquery',
    'underscore',
    './models/location',
    './models/technology',
    './models/tag',
    './models/topic',
    './models/topic_tag',
    './models/tenant',
    './models/user',
    './models/developer_profile',
    './models/employer_profile',
    './models/chat',
    './models/archive',
    './models/skill',
    './models/position_pref',
    './models/technology_pref',
    './models/location_pref',
    './models/chat_participant',
    './models/chat_credential',
    './models/chat_message',
    './models/chat_reel',
    './models/requisition',
    './models/requisition_technology',
    './models/application',
    './models/application_log',
    './models/application_score',
    './models/application_vote',
    './models/interview_offer',
    './models/job_offer',
    './models/job_note',
    './models/job_event',
    './models/user_search',
    './models/technology_search',
    './models/location_search',
    './models/talking_point',
    './models/topic_search'
], function(
    $,
    _,
    location_models,
    technology_models,
    tag_models,
    topic_models,
    topic_tag_models,
    tenant_models,
    user_models,
    developer_profile_models,
    employer_profile_models,
    chat_models,
    archive_models,
    skill_models,
    position_pref_models,
    technology_pref_models,
    location_pref_models,
    chat_participant_models,
    chat_credential_models,
    chat_message_models,
    chat_reel_models,
    requisition_models,
    requisition_technology_models,
    application_models,
    application_log_models,
    application_score_models,
    application_vote_models,
    interview_offer_models,
    job_offer_models,
    job_note_models,
    job_event_models,
    user_search_models,
    technology_search_models,
    location_search_models,
    talking_point_models,
    topic_search_models) {


    return {
        Location: location_models.Location,
        LocationCollection: location_models.LocationCollection,
        Technology: technology_models.Technology,
        TechnologyCollection: technology_models.TechnologyCollection,
        Tag: tag_models.Tag,
        TagCollection: tag_models.TagCollection,
        Topic: topic_models.Topic,
        TopicCollection: topic_models.TopicCollection,
        TopicTag: topic_tag_models.TopicTag,
        TopicTagCollection: topic_tag_models.TopicTagCollection,
        User: user_models.User,
        UserCollection: user_models.UserCollection,
        DeveloperProfile: developer_profile_models.DeveloperProfile,
        DeveloperProfileCollection: developer_profile_models.DeveloperProfileCollection,
        EmployerProfile: employer_profile_models.EmployerProfile,
        EmployerProfileCollection: employer_profile_models.EmployerProfileCollection,
        Chat: chat_models.Chat,
        ChatCollection: chat_models.ChatCollection,
        Archive: archive_models.Archive,
        ArchiveCollection: archive_models.ArchiveCollection,
        Skill: skill_models.Skill,
        SkillCollection: skill_models.SkillCollection,
        PositionPref: position_pref_models.PositionPref,
        PositionPrefCollection: position_pref_models.PositionPrefCollection,
        TechnologyPref: technology_pref_models.TechnologyPref,
        TechnologyPrefCollection: technology_pref_models.TechnologyPrefCollection,
        LocationPref: location_pref_models.LocationPref,
        LocationPrefCollection: location_pref_models.LocationPrefCollection,
        ChatParticipant: chat_participant_models.ChatParticipant,
        ChatParticipantCollection: chat_participant_models.ChatParticipantCollection,
        ChatCredential: chat_credential_models.ChatCredential,
        ChatCredentialCollection: chat_credential_models.ChatCredentialCollection,
        ChatMessage: chat_message_models.ChatMessage,
        ChatMessageCollection: chat_message_models.ChatMessageCollection,
        ChatReel: chat_reel_models.ChatReel,
        ChatReelCollection: chat_reel_models.ChatReelCollection,
        Requisition: requisition_models.Requisition,
        RequisitionCollection: requisition_models.RequisitionCollection,
        RequisitionTechnology: requisition_technology_models.RequisitionTechnology,
        RequisitionTechnologyCollection: requisition_technology_models.RequisitionTechnologyCollection,
        Application: application_models.Application,
        ApplicationCollection: application_models.ApplicationCollection,
        ApplicationLog: application_log_models.ApplicationLog,
        ApplicationLogCollection: application_log_models.ApplicationLogCollection,
        ApplicationScore: application_score_models.ApplicationScore,
        ApplicationScoreCollection: application_score_models.ApplicationScoreCollection,
        ApplicationVote: application_vote_models.ApplicationVote,
        ApplicationVoteCollection: application_vote_models.ApplicationVoteCollection,
        InterviewOffer: interview_offer_models.InterviewOffer,
        InterviewOfferCollection: interview_offer_models.InterviewOfferCollection,
        JobOffer: job_offer_models.JobOffer,
        JobOfferCollection: job_offer_models.JobOfferCollection,
        JobNote: job_note_models.JobNote,
        JobNoteCollection: job_note_models.JobNoteCollection,
        JobEvent: job_event_models.JobEvent,
        JobEventCollection: job_event_models.JobEventCollection,
        UserSearch: user_search_models.UserSearch,
        UserSearchCollection: user_search_models.UserSearchCollection,
        TechnologySearch: technology_search_models.TechnologySearch,
        TechnologySearchCollection: technology_search_models.TechnologySearchCollection,
        LocationSearch: location_search_models.LocationSearch,
        LocationSearchCollection: location_search_models.LocationSearchCollection,
        TalkingPoint: talking_point_models.TalkingPoint,
        TalkingPointCollection: talking_point_models.TalkingPointCollection,
        TopicSearch: topic_search_models.TopicSearch,
        TopicSearchCollection: topic_search_models.TopicSearchCollection
    };
});
