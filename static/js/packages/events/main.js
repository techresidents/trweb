define(/** @exports events */[
], function() {

    return {
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

        /* CHAT ACTIONS */
        CREATE_CHAT: 'create_chat',
        PARTICIPATE_IN_CHAT: 'participate_in_chat',
        UPDATE_TALKING_POINTS: 'update_talking_points',
        UPDATE_CHAT_REEL: 'update_chat_reel'
    };
});
