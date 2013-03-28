define([
], function() { 

    return {

        /* APPLICATION ACTIONS */
        CREATE_APPLICATION: 'talent:CreateApplication',
        UPDATE_APPLICATION_STATUS: 'talent:UpdateApplicationStatus',
        SCORE_APPLICANT: 'talent:ScoreApplicant',

        /* APPLICATION LOG ACTIONS */
        CREATE_APPLICATION_LOG: 'talent:CreateApplicationLog',

        /* INTERVIEW OFFER ACTIONS */
        MAKE_INTERVIEW_OFFER: 'talent:MakeInterviewOffer',
        RESCIND_INTERVIEW_OFFER: 'talent:RescindInterviewOffer',
        SHOW_MAKE_INTERVIEW_OFFER: 'talent:ShowMakeInterviewOffer',
        SHOW_RESCIND_INTERVIEW_OFFER: 'talent:ShowRescindInterviewOffer',

        /* PLAYER ACTIONS */
        PLAYER_PLAY: 'talent:PlayerPlay',
        PLAYER_PAUSE: 'talent:PlayerPause',

        /* PLAYER NOTICES */
        PLAYER_STATE_CHANGED: 'talent:PlayerStateChanged'
    };
});
