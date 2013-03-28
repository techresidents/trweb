define([
], function() { 

    return {

        /* APPLICATION_ACTIONS */
        CREATE_APPLICATION: 'talent:CreateApplication',
        UPDATE_APPLICATION_STATUS: 'talent:UpdateApplicationStatus',

        /* INTERVIEW_OFFER_ACTIONS */
        MAKE_INTERVIEW_OFFER: 'talent:MakeInterviewOffer',
        RESCIND_INTERVIEW_OFFER: 'talent:RescindInterviewOffer',
        SHOW_MAKE_INTERVIEW_OFFER: 'talent:ShowMakeInterviewOffer',
        SHOW_RESCIND_INTERVIEW_OFFER: 'talent:ShowRescindInterviewOffer',

        /* PLAYER_ACTIONS */
        PLAYER_PLAY: 'talent:PlayerPlay',
        PLAYER_PAUSE: 'talent:PlayerPause',

        /* PLAYER_NOTICES */
        PLAYER_STATE_CHANGED: 'talent:PlayerStateChanged'
    };
});
