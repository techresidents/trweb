define([
    'common/notifications',
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
    'resource/models'
], function(
    notifications,
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
     *   {string} chatSessionId Chat Session Id
     *   {string} chatApiKey Tokbox api key
     *   {string} chatSessionToken Tokbox session token
     *   {string} chatUserToken Tokbox user token
     *
     * This is the main proxy for the chat. 
     * It's responsible for creating sub-proxies.
     */
    var ChatProxy = proxy.Proxy.extend({
        
        name: function() {
            return ChatProxy.NAME;
        },

        initialize: function(options) {
            this.options = options;

            //chat session proxy
            this.chatSessionProxy = new session_proxies.ChatSessionProxy({
                sessionId: options.chatSessionId,
                apiKey: options.chatAPIKey,
                sessionToken: options.chatSessionToken,
                userToken: options.chatUserToken
            });
            this.chatSessionProxy.getUsersProxy().reset(options.users);
            this.facade.registerProxy(this.chatSessionProxy);

            
            //chat messages proxy
            this.chatMessagesProxy = new message_proxies.ChatMessagesProxy({
                collection: new message_models.ChatMessageCollection(null, {
                    chatSessionToken: options.chatSessionToken,
                    userId: this.chatSessionProxy.getCurrentUser().id
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
            
            //schedule chat termination to protect us in the case where the chat is
            //not ended in a timely manner.
            this.scheduleTermination();
        },

        /**
         *
         */
        scheduleTermination: function() {
            var that = this;
            var topic = this.chatAgendaProxy.topicCollection.first();
            var minute = this.chatAgendaProxy.minuteCollection.first();
            var start, end, now = new Date();
            if(minute && minute.startTimestamp) {
                start = new Date(minute.startTimestamp * 1000);
            } else {
                start = new Date();
            }

            end = new Date(start.getTime() + topic.duration()*1000 + 60*5*1000);
            
            setTimeout(function() {
                that.facade.trigger(notifications.ALERT, {
                    severity: 'warning',
                    message: 'Chat will terminate in 1 minute ...'
                });
            }, end - now  - 60000);

            setTimeout(function() {
                that.facade.trigger(notifications.CHAT_END);
            }, end - now);
        },
        
        /**
         * Determine if chat is currently active.
         * Note that the chat can be connected but not yet active.
         * @return {boolean} true if active, false otherwise
         */
        isActive: function() {
            if(this.chatAgendaProxy.active()) {
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
            this.chatMessagesProxy.startLongPoll();

            if(this.options.chatRecorded) {
                this.startRecording();
            }
        },

        /**
         * Disconnect the chat.
         */
        disconnect: function() {
            if(this.options.chatRecorded) {
                this.stopRecording();
            }

            this.chatSessionProxy.disconnect();
            this.chatMessagesProxy.stopLongPoll();
        },
    
        /**
         * Start recording the chat
         */
        startRecording: function() {
            this.chatSessionProxy.startRecording();
        },

        /**
         * Stop recording the chat
         */
        stopRecording: function() {
            this.chatSessionProxy.stopRecording();
        },

        /**
         * Start the chat
         */
        start: function() {
            if(!this.isActive()) {
                this.chatAgendaProxy.activateNext();
            }
        },

        /**
         * End the chat
         */
        end: function() {
            var i=1, nextActive;
            var that = this;
            var activateNext = function() {
                that.chatAgendaProxy.activateNext();
            };
            
            if(this.isActive()) {
                nextActive = this.chatAgendaProxy.nextActive();
                this.chatAgendaProxy.activateNext();

                while(nextActive) {
                    //note that nextActive() must be calculated relative
                    //to the current value of nextActive since the
                    //above activateNext() will take time to propagate
                    //the new active topic, since this requires
                    //a network request.
                    nextActive = this.chatAgendaProxy.nextActive(nextActive);

                    //delay nextActive() by a 1 second to allow time for
                    //server response.
                    setTimeout(activateNext, i*1000);
                    i++;
                }

            }
        }

    }, {

        NAME: 'ChatProxy'

    });

    return {
        ChatProxy: ChatProxy
    };
   
});
