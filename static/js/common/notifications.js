define([
], function() { 

    return {
        /* ALERT ACTIONS */
        ALERT: 'notification:Alert',

        /* APP ACTIONS */
        APP_START: 'notification:AppStart',
        APP_STOP: 'notification:AppStop',

        /* CHAT ACTIONS */
        CHAT_CONNECT: 'notification:ChatConnect',
        CHAT_START: 'notification:ChatStart',
        CHAT_END: 'notification:ChatEnd',
        CHAT_NEXT_TOPIC: 'notification:ChatNextTopic',

        /* CHAT NOTICES */
        CHAT_STARTED: 'notification:ChatStarted',
        CHAT_ENDED: 'notification:ChatEnded',
        CHAT_TOPIC_CHANGED: 'notification:ChatTopicChanged',

        /* DOCUMENT NOTICES */
        DOCUMENT_ADDED: 'notification:DocumentAdded',
        DOCUMENT_REMOVED: 'notification:DocumentRemoved',

        /* DOM NOTICES */
        DOM_READY: 'notification:DomReady',

        /* MARKER NOTICES */
        MARKER_ADDED: 'notification:MarkerAdded',

        /* MARKER ACTIONSS */
        MARKER_CREATE: 'notification:MarkerCreate',
        MARKER_CONNECTED_CREATE: 'notification:MarkerConnectedCreate',
        MARKER_JOINED_CREATE: 'notification:MarkerJoinedCreate',
        MARKER_PUBLISHING_CREATE: 'notification:MarkerPublishingCreate',
        MARKER_SPEAKING_CREATE: 'notification:MarkerSpeakingCreate',

        /* MESSAGE ACTIONS */
        MESSAGE_MARKER_CREATE: 'notification:Message:MarkerCreate',
        MESSAGE_MINUTE_CREATE: 'notification:Message:MinuteCreate',
        MESSAGE_MINUTE_UPDATE: 'notification:MessageMinuteUpdate',
        MESSAGE_TAG_CREATE: 'notification:MessageTagCreate',
        MESSAGE_TAG_DELETE: 'notification:MessageTagDelete',
        MESSAGE_WHITEBOARD_CREATE: 'notification:MessageWhiteboardCreate',
        MESSAGE_WHITEBOARD_DELETE: 'notification:MessageWhiteboardDelete',
        MESSAGE_WHITEBOARD_CREATE_PATH: 'notification:MessageWhiteboardCreatePath',
        MESSAGE_WHITEBOARD_DELETE_PATH: 'notification:MessageWhiteboardDeletePath',

        /* MESSAGE NOTICES */
        MESSAGE_ADDED: 'notification:MessageAdded',

        /* MINUTE ACTIONS */
        MINUTE_START: 'notificationMinuteStart',
        MINUTE_END: 'notificationMinuteEnd',

        /* MINUTE NOTICES */
        MINUTE_STARTED: 'notification:MinuteAdded',
        MINUTE_ENDED: 'notification:MinuteEneded',

        /* RESOURCE ACTIONS */
        RESOURCE_SELECT: 'notification:ResourceSelect',

        /* RESOURCE NOTICES */
        RESOURCE_ADDED: 'notification:ResourceAdded',
        RESOURCE_REMOVED: 'notification:ResourceRemoved',

        /* SESSION NOTICES */
        SESSION_CONNECTED: 'notification:SessionConnected',
        SESSION_CONNECTION_CREATED: 'notificationSessionConnectionCreated',
        SESSION_CONNECTION_DESTROYED: 'notification:SessionConnectionDestroyed',
        SESSION_STREAM_CREATED: 'notification:SessionStreamCreated',
        SESSION_STREAM_DESTROYED: 'notification:SessionStreamDestroyed',
        SESSION_MICROPHONE_LEVEL_CHANGED: 'notification:SessionMicrohponeLevelChanged',

        /* SHOW ACTIONS */
        SHOW_AGENDA: 'notification:ShowAgenda',
        SHOW_FEEDBACK: 'notification:ShowFeedback',
        SHOW_RESOURCES: 'notification:ShowResources',
        SHOW_RESOURCE: 'notification:ShowResource',
        SHOW_WHITEBOARDS: 'notification:ShowWhiteboards',

        /* TAG ACTIONS */
        TAG_CREATE: 'notification:TagCreate',
        TAG_DELETE: 'notification:TagDelete',

        /* TAG NOTICES */
        TAG_ADDED: 'notification:TagAdded',
        TAG_REMOVED: 'notification:TagRemoved',

        /* TOPIC NOTICES */
        TOPIC_ADDED: 'notification:TopicAdded',
        TOPIC_CHANGED: 'notification:TopicChanged',
        TOPIC_REMOVED: 'notification:TopicRemoved',

        /* USER NOTICES */
        USER_ADDED: 'notification:UserAdded',
        USER_CHANGED: 'notification:UserChanged',
        USER_CONNECTED_CHANGED: 'notification:UserConnectedChanged',
        USER_PUBLISHING_CHANGED: 'notification:UserPublishingChanged',
        USER_SPEAKING_CHANGED: 'notification:UserSpeakingChanged',
        USER_REMOVED: 'notification:UserRemoved',

        /* VIEW NOTICES */
        VIEW_CREATED: 'notification:ViewCreated',
        VIEW_DESTROYED: 'notification:ViewDestroyed',
        
        /* WHITEBOARD ACTIONS */
        WHITEBOARD_CREATE: 'notification:WhiteboardCreate',
        WHITEBOARD_DELETE: 'notification:WhiteboardDelete',
        WHITEBOARD_PATH_CREATE: 'notification:WhiteboardPathCreate',
        WHITEBOARD_PATH_DELETE: 'notification:WhiteboardPathDelete',

        /* WHITEBOARD NOTICES */
        WHITEBOARD_ADDED: 'notification:WhiteboardAdded',
        WHITEBOARD_REMOVED: 'notification:WhiteboardRemoved'
    };
});
