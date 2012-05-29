define([
    'Underscore',
    'core/proxy',
    'chat/user/models',
    'chat/user/proxies',
], function(_, proxy, user_models, user_proxies) {
    
    var ChatSessionProxy = proxy.Proxy.extend({

        name: function() {
            return ChatSessionProxy.NAME;
        },

        initialize: function(options) {
            this.apiKey = options.apiKey;
            this.sessionToken = options.sessionToken;
            this.userToken = options.userToken;
            this.usersProxy = new user_proxies.ChatUsersProxy({
                collection: new user_models.ChatUserCollection(),
            });
            this.session =  TB.initSession(this.sessionToken);

            //make 'this' available for tokbox event listeners
            var that = this;
            
            //tokbox event listeners defined inline delegate to ChatSession handlers with 'this' set properly.
            this.session.addEventListener("sessionConnected", function(event) { that.sessionConnectedHandler.call(that, event); });
            this.session.addEventListener("connectionCreated", function(event) { that.connectionCreatedHandler.call(that, event); });
            this.session.addEventListener("connectionDestroyed", function(event) { that.connectionDestroyedHandler.call(that, event); });
            this.session.addEventListener("streamCreated", function(event) { that.streamCreatedHandler.call(that, event); });
            this.session.addEventListener("streamDestroyed", function(event) { that.streamDestroyedHandler.call(that, event); });
            this.session.addEventListener("microphoneLevelChanged", function(event) { that.microphoneLevelHandler.call(that, event); });
        },

        getApiKey: function() {
            return this.apiKey;
        },

        getSessionToken: function() {
            return this.sessionToken;
        },

        getUserToken: function() {
            return this.userToken;
        },

        getSession: function() {
            return this.session;
        },

        getUsersProxy: function() {
            return this.usersProxy;
        },
        
        getCurrentUser: function() {
            return this.getUsersProxy().collection.first();
        },
        
        /**
         * Connect chat session.
         */
        connect: function() {
            var session = this.getSession();
            var userToken = this.getUserToken();
            var apiKey = this.getApiKey();
            
            session.connect(apiKey, userToken);
        },

        sessionConnectedHandler: function(event) {
            this.facade.trigger(ChatSessionProxy.CONNECTED, event);

            for(var i = 0; i < event.connections.length; i++) {
                var connection = event.connections[i];
                var connectionData = JSON.parse(connection.data);
                
                var user = this.usersProxy.get(connectionData.id);
                user.setConnected(true);
            }

        },

        connectionCreatedHandler: function(event) {
            this.facade.trigger(ChatSessionProxy.CONNECTED, event);

            for(var i = 0; i < event.connections.length; i++) {
                var connection = event.connections[i];
                var connectionData = JSON.parse(connection.data);

                var user = this.usersProxy.get(connectionData.id);
                user.setConnected(true);
            }
        },

        connectionDestroyedHandler: function(event) {
            this.facade.trigger(ChatSessionProxy.CONNECTION_DESTROYED, event);

            for(var i = 0; i < event.connections.length; i++) {
                var connection = event.connections[i];
                var connectionData = JSON.parse(connection.data);

                var user = this.usersProxy.get(connectionData.id);
                user.setConnected(false);
            }

        },

        streamCreatedHandler: function(event) {
            this.facade.trigger(ChatSessionProxy.STREAM_CREATED, event);

            for(var i = 0; i < event.streams.length; i++) {
                var stream = event.streams[i];
                var connectionData = JSON.parse(stream.connection.data);
                
                var user = this.usersProxy.get(connectionData.id);
                user.setStreamId(stream.id);
                user.setPublishing(true);
            }
        },

        streamDestroyedHandler: function(event) {
            this.facade.trigger(ChatSessionProxy.STREAM_DESTROYED, event);

            for(var i = 0; i < event.streams.length; i++) {
                var stream = event.streams[i];
                var connectionData = JSON.parse(stream.connection.data);
                
                var user = this.usersProxy.get(connectionData.id);
                user.setStreamId(null);
                user.setPublishing(false);
            }
        },

        microphoneLevelHandler: function(event) {
            /*
            var user = this.getUsers().where({streamId: event.streamId})[0];
            if(event.volume > 1) {
                user.setSpeaking(true);
                console.log("speaking");
            } else {
                user.setSpeaking(false);
                console.log("not speaking");
            }
            this.trigger("microphone:changed", event);
            */
        },

    }, {

        NAME: 'ChatSessionProxy',

        /* NOTIFICATIONS */

        CONNECTED: 'ChatSession:connected',
        CONNECTION_CREATED: 'ChatSession:connectionCreated',
        CONNECTION_DESTROYED: 'ChatSession:connectionDestroyed',
        STREAM_CREATED: 'ChatSession:streamCreated',
        STREAM_DESTROYED: 'ChatSession:streamDestroyed',
        MICROPHONE_LEVEL: 'ChatSession:microphoneLevel',

    });

    return {
        ChatSessionProxy: ChatSessionProxy,
    }
});
