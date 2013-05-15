define([
], function() { 

    return {
        /* ALERT ACTIONS */
        ALERT: 'notification:Alert',

        /* APP ACTIONS */
        APP_START: 'notification:AppStart',
        APP_STOP: 'notification:AppStop',

        /* DOM NOTICES */
        DOM_READY: 'notification:DomReady',

        /* VIEW ACTIONS */
        VIEW_CREATE: 'notification:ViewCreate',
        VIEW_DESTROY: 'notification:ViewDestroy',
        VIEW_NAVIGATE: 'notification:ViewNavigate',

        /* VIEW NOTICES */
        VIEW_CREATED: 'notification:ViewCreated',
        VIEW_DESTROYED: 'notification:ViewDestroyed',

        /* APPLICATION ACTIONS */
        CREATE_APPLICATION: 'talent:CreateApplication',
        UPDATE_APPLICATION_STATUS: 'talent:UpdateApplicationStatus',
        SCORE_APPLICANT: 'talent:ScoreApplicant',
        CAST_APPLICANT_VOTE: 'talent:CastApplicantVote',

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
        PLAYER_STATE_CHANGED: 'talent:PlayerStateChanged',

        /* DEVELOPER NOTE ACTIONS */
        TAKE_NOTE: 'talent:TakeNote'
    };
});
