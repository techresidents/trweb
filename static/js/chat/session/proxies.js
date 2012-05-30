define([
    'Underscore',
    'common/notifications',
    'core/proxy',
    'chat/user/models',
    'chat/user/proxies',
], function(
    _,
    notifications,
    proxy,
    user_models,
    user_proxies) {
    
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
            
            this.session.addEventListener("sessionConnected", _.bind(this.sessionConnectedHandler, this));
            this.session.addEventListener("connectionCreated", _.bind(this.connectionCreatedHandler, this));
            this.session.addEventListener("connectionDestroyed", _.bind(this.connectionDestroyedHandler, this));
            this.session.addEventListener("streamCreated", _.bind(this.streamCreatedHandler, this));
            this.session.addEventListener("streamDestroyed", _.bind(this.streamDestroyedHandler, this));
            this.session.addEventListener("microphoneLevelChanged", _.bind(this.microphoneLevelHandler, this));
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
            this.facade.trigger(notifications.SESSION_CONNECTED, event);

            for(var i = 0; i < event.connections.length; i++) {
                var connection = event.connections[i];
                var connectionData = JSON.parse(connection.data);
                
                var user = this.usersProxy.get(connectionData.id);
                user.setConnected(true);
            }

        },

        connectionCreatedHandler: function(event) {
            this.facade.trigger(notifications.SESSION_CONNECTION_CREATED, event);

            for(var i = 0; i < event.connections.length; i++) {
                var connection = event.connections[i];
                var connectionData = JSON.parse(connection.data);

                var user = this.usersProxy.get(connectionData.id);
                user.setConnected(true);
            }
        },

        connectionDestroyedHandler: function(event) {
            this.facade.trigger(notifications.SESSION_CONNECTION_DESTROYED, event);

            for(var i = 0; i < event.connections.length; i++) {
                var connection = event.connections[i];
                var connectionData = JSON.parse(connection.data);

                var user = this.usersProxy.get(connectionData.id);
                user.setConnected(false);
            }

        },

        streamCreatedHandler: function(event) {
            this.facade.trigger(notifications.SESSION_STREAM_CREATED, event);

            for(var i = 0; i < event.streams.length; i++) {
                var stream = event.streams[i];
                var connectionData = JSON.parse(stream.connection.data);
                
                var user = this.usersProxy.get(connectionData.id);
                user.setStreamId(stream.id);
                user.setPublishing(true);
            }
        },

        streamDestroyedHandler: function(event) {
            this.facade.trigger(notifications.SESSION_STREAM_DESTROYED, event);

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
    });

    return {
        ChatSessionProxy: ChatSessionProxy,
    }
});
