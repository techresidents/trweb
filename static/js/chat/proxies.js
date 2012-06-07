define([
    'core/proxy',
    'chat/agenda/proxies',
    'chat/marker/models',
    'chat/marker/proxies',
    'chat/message/models',
    'chat/message/proxies',
    'chat/minute/models',
    'chat/minute/proxies',
    'chat/resource/proxies',
    'chat/session/proxies',
    'chat/tag/models',
    'chat/tag/proxies',
    'chat/whiteboard/models',
    'chat/whiteboard/proxies',
    'resource/models',
], function(
    proxy,
    agenda_proxies,
    marker_models,
    marker_proxies,
    message_models,
    message_proxies,
    minute_models,
    minute_proxies,
    resource_proxies,
    session_proxies,
    tag_models,
    tag_proxies,
    whiteboard_models,
    whiteboard_proxies,
    resource_models) {

    /**
     * Chat Proxy
     * @constructor
     * @param {Object} options
     *   {string} apiKey Tokbox api key
     *   {string} sessionToken Tokbox session token
     *   {string} userToken Tokbox user token
     *
     * This is the main proxy for the chat. 
     * It's responsible for creating sub-proxies.
     */
    var ChatProxy = proxy.Proxy.extend({
        
        name: function() {
            return ChatProxy.NAME;
        },

        initialize: function(options) {

            //chat session proxy
            this.chatSessionProxy = new session_proxies.ChatSessionProxy({
                apiKey: options.chatAPIKey,
                sessionToken: options.chatSessionToken,
                userToken: options.chatUserToken,
            });
            this.chatSessionProxy.getUsersProxy().reset(options.users);
            this.facade.registerProxy(this.chatSessionProxy);

            
            //chat messages proxy
            this.chatMessagesProxy = new message_proxies.ChatMessagesProxy({
                collection: new message_models.ChatMessageCollection(null, {
                    chatSessionToken: options.chatSessionToken,
                    userId: this.chatSessionProxy.getCurrentUser().id,
                })
            });

            //chat markers proxy
            this.chatMarkersProxy = new marker_proxies.ChatMarkersProxy({
                collection: new marker_models.MarkerCollection()
            });
            this.facade.registerProxy(this.chatMarkersProxy);


            //chat resources proxy
            this.chatResourcesProxy = new resource_proxies.ChatResourcesProxy({
                collection: new resource_models.ResourceCollection()
            });
            this.chatResourcesProxy.reset(options.resources);
            this.facade.registerProxy(this.chatResourcesProxy);


            //chat agenda proxy
            this.chatAgendaProxy = new agenda_proxies.ChatAgendaProxy();
            this.chatAgendaProxy.topicsProxy.reset(options.topics);
            this.facade.registerProxy(this.chatAgendaProxy);


            //chat tags proxy
            this.chatTagsProxy = new tag_proxies.ChatTagsProxy({
                collection: new tag_models.TagCollection()
            });
            this.facade.registerProxy(this.chatTagsProxy);


            //chat whiteboards proxy
            this.chatWhiteboardsProxy = new whiteboard_proxies.ChatWhiteboardsProxy({
                collection: new whiteboard_models.WhiteboardCollection()
            });
            this.facade.registerProxy(this.chatWhiteboardsProxy);
        },
        
        /**
         * Determine if chat is currently active.
         * Note that the chat can be connected but not yet active.
         * @return {boolean} true if active, false otherwise
         */
        isActive: function() {
            if(this.agendaProxy.active()) {
                return true;
            } else {
                return false;
            }
        },
        
        /**
         * Connect the chat.
         */
        connect: function() {
            //connect the chat and start polling for messages.
            this.chatSessionProxy.connect();
            this.chatMessagesProxy.longPoll();
        },

    }, {

        NAME: 'ChatProxy',

    });

    return {
        ChatProxy: ChatProxy,
    };
   
});
