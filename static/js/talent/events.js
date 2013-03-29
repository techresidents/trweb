define([
], function() { 

    return {
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
        SHOW_RESCIND_INTERVIEW_OFFER: 'show_rescind_interview_offer'
    };
});
