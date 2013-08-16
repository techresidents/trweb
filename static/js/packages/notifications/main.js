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
        CREATE_APPLICATION: 'notification:CreateApplication',
        UPDATE_APPLICATION_STATUS: 'notification:UpdateApplicationStatus',
        SCORE_APPLICANT: 'notification:ScoreApplicant',
        CAST_APPLICANT_VOTE: 'notification:CastApplicantVote',

        /* APPLICATION LOG ACTIONS */
        CREATE_APPLICATION_LOG: 'notification:CreateApplicationLog',

        /* INTERVIEW OFFER ACTIONS */
        MAKE_INTERVIEW_OFFER: 'notification:MakeInterviewOffer',
        RESCIND_INTERVIEW_OFFER: 'notification:RescindInterviewOffer',

        /* PLAYER ACTIONS */
        PLAYER_PLAY: 'notification:PlayerPlay',
        PLAYER_PAUSE: 'notification:PlayerPause',

        /* PLAYER NOTICES */
        PLAYER_STATE_CHANGED: 'notification:PlayerStateChanged',

        /* DEVELOPER NOTE ACTIONS */
        TAKE_NOTE: 'notification:TakeNote',

        /* CHAT ACTIONS */
        CREATE_CHAT: 'notification:CreateChat',
        PARTICIPATE_IN_CHAT: 'notification:ParticipateInChat',
        UPDATE_CHAT_STATUS: 'notification:UpdateChatStatus',
        UPDATE_CHAT_USER_STATUS: 'notification:UpdateChatUserStatus',
        UPDATE_TALKING_POINTS: 'notification:UpdateTalkingPoints',
        UPDATE_CHAT_REEL: 'notification:UpdateChatReel',
        ADD_CHAT_TO_REEL: 'notification:AddChatToReel',

        /* BROWSER ACTIONS */
        CHECK_BROWSER_COMPATIBILITY: 'notification:CheckBrowserCompatibility',
        CHECK_FLASH_COMPATIBILITY: 'notification:CheckFlashCompatibility',

        /* PROFILE ACTIONS */
        UPDATE_USER: 'notification:UpdateUser',
        UPDATE_SKILLS: 'notification:UpdateSkills',
        UPDATE_LOCATION_PREFS: 'notification:UpdateLocationPrefs',
        UPDATE_POSITION_PREFS: 'notification:UpdatePositionPrefs',
        UPDATE_TECHNOLOGY_PREFS: 'notification:UpdateTechnologyPrefs',
        UPDATE_DEVELOPER_PROFILE: 'notification:UpdateDeveloperProfile',
        UPDATE_DEVELOPER_ACCOUNT: 'notification:UpdateDeveloperAccount',
        UPDATE_DEVELOPER_PREFERENCES: 'notification:UpdateDeveloperPreferences',
        
        /* REQUISITION ACTIONS */
        UPDATE_REQUISITION: 'notification:UpdateRequisition',
        UPDATE_REQUISITION_TECHNOLOGIES: 'notification:UpdateRequisitionTechnologies',
        SAVE_REQUISITION: 'notification:SaveRequisition',

        /* TRACK ACTIONS */
        TRACK_PAGE_VIEW: 'notification:TrackPageView'
    };
});
