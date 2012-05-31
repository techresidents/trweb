define([
    'core/proxy',
    'chat/agenda/proxies',
    'chat/message/dispatch',
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
    message_dispatch,
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

    var ChatProxy = proxy.Proxy.extend({
        
        name: function() {
            return ChatProxy.NAME;
        },

        initialize: function(options) {
            //create chat session (not yet connected)
            this.chatSessionProxy = new session_proxies.ChatSessionProxy({
                apiKey: options.chatAPIKey,
                sessionToken: options.chatSessionToken,
                userToken: options.chatUserToken,
            });
            this.chatSessionProxy.getUsersProxy().reset(options.users);
            this.facade.registerProxy(this.chatSessionProxy);
            this.facade.registerProxy(this.chatSessionProxy.getUsersProxy());


            this.chatMessagesProxy = new message_proxies.ChatMessagesProxy({
                collection: new message_models.ChatMessageCollection(null, {
                    chatSessionToken: options.chatSessionToken,
                    userId: this.chatSessionProxy.getCurrentUser().id,
                })
            });

            this.chatResourcesProxy = new resource_proxies.ChatResourcesProxy({
                collection: new resource_models.ResourceCollection()
            });
            this.chatResourcesProxy.reset(options.resources);
            this.facade.registerProxy(this.chatResourcesProxy);

            this.chatAgendaProxy = new agenda_proxies.ChatAgendaProxy();
            this.chatAgendaProxy.topicsProxy.reset(options.topics);
            this.facade.registerProxy(this.chatAgendaProxy);

            this.chatTagsProxy = new tag_proxies.ChatTagsProxy({
                collection: new tag_models.TagCollection()
            });
            this.facade.registerProxy(this.chatTagsProxy);

            this.chatWhiteboardsProxy = new whiteboard_proxies.ChatWhiteboardsProxy({
                collection: new whiteboard_models.WhiteboardCollection()
            });
            this.facade.registerProxy(this.chatWhiteboardsProxy);
        },
        
        getChatSessionProxy: function() {
            return this.chatSessionProxy;
        },

        getChatMessagesProxy: function() {
            return this.chatMessagesProxy;
        },

        isActive: function() {
            if(this.agendaProxy.active()) {
                return true;
            } else {
                return false;
            }
        },

        connect: function() {
            //connect the chat and start polling for messages.
            this.getChatSessionProxy().connect();
            this.getChatMessagesProxy().longPoll();
        },

    }, {

        NAME: 'ChatProxy',

    });

    return {
        ChatProxy: ChatProxy,
    };
   
});
