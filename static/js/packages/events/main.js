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
        SHOW_MAKE_INTERVIEW_OFFER: 'show_interview_offer',
        SHOW_RESCIND_INTERVIEW_OFFER: 'show_rescind_interview_offer',

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
        PLAYER_PAUSE: 'player_pause'
    };
});
