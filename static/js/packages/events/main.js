define(/** @exports events */[
], function() {

    return {
        /* ALERT EVENTS */
        ALERT: 'alert',

        /* VIEW EVENTS */
        VIEW_NAVIGATE: 'view_navigate',

        /* APPLICATION EVENTS */
        CREATE_APPLICATION: 'create_application',
        UPDATE_APPLICATION_STATUS: 'update_application_status',
        SCORE_APPLICANT: 'score_applicant',
        CAST_APPLICANT_VOTE: 'cast_applicant_vote',

        /* APPLICATION LOG EVENTS */
        CREATE_APPLICATION_LOG: 'create_application_log',

        /* INTERVIEW OFFER EVENTS */
        MAKE_INTERVIEW_OFFER: 'make_interview_offer',
        RESCIND_INTERVIEW_OFFER: 'rescind_interview_offer',
        ACCEPT_INTERVIEW_OFFER: 'accept_interview_offer',
        DECLINE_INTERVIEW_OFFER: 'decline_interview_offer',

        /* DEVELOPER NOTE EVENTS*/
        TAKE_NOTE: 'take_note',

        /* CHAT EVENTS */
        CREATE_CHAT: 'create_chat',
        PARTICIPATE_IN_CHAT: 'participate_in_chat',
        UPDATE_CHAT_STATUS: 'update_chat_status',
        UPDATE_CHAT_USER_STATUS: 'update_chat_user_status',
        UPDATE_TALKING_POINTS: 'update_talking_points',
        UPDATE_CHAT_REEL: 'update_chat_reel',
        ADD_CHAT_TO_REEL: 'add_chat_to_reel',

        /* PLAYER EVENTS */
        PLAYER_PLAY: 'player_play',
        PLAYER_PAUSE: 'player_pause',

        /* PROFILE EVENTS */
        UPDATE_USER: 'update_user',
        UPDATE_SKILLS: 'update_skills',
        UPDATE_DEVELOPER_ACCOUNT: 'update_developer_account',
        UPDATE_DEVELOPER_PROFILE: 'update_developer_profile',
        UPDATE_DEVELOPER_PREFERENCES: 'update_developer_preferences',
        
        /* REQUISTION EVENTS */
        SAVE_REQUISITION: 'save_requisition',

        /* COMPANY PROFILE EVENTS */
        UPDATE_COMPANY_PROFILE: 'update_company_profile',

        /* TRACK ACTIONS */
        TRACK_EVENT: 'track_event'
    };
});
