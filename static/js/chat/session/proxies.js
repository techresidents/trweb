define([
    'Underscore',
    'common/notifications',
    'core/array',
    'core/base',
    'core/proxy',
    'chat/user/models',
    'chat/user/proxies',
], function(
    _,
    notifications,
    array,
    base,
    proxy,
    user_models,
    user_proxies) {

    var StreamSample = base.Base.extend({
        initialize: function(options) {
            this.id = options.id || _.uniqueId('StreamSample_');
            console.log(this.id);
            this.volume = options.volume;
            this.timestamp = new Date().valueOf() / 1000;
        },

        compareVolume: function(a, b) {
            var result = 0;
            if(a.volume > b.volume) {
                result = 1;
            } else if(a.volume < b.volume) {
                result = -1;
            }
            return result;
        },
    });

    var Stream = base.Base.extend({

        initialize: function(options) {
            this.period = 60;
            this.maxSamples = this.period * 2;
            this.samples = [];

            this.user = options.user;
        },
        
        addSample: function (sample) {
            array.binaryInsert(this.samples, sample, sample.compareVolume);
            if(this.samples.length > this.maxSamples) {
                this.samples.pop();
            }
        },
        
        average: function() {
            var expiredTimestamp = (new Date().valueOf() / 1000) - this.period;

            var minSamples = [];
            var garbageCollect = [];

            for(var i = 0; i < this.samples.length; i++) {
                var sample = this.samples[i];
                if(sample.timestamp < expiredTimestamp) {
                    garbageCollect.push(i);
                } else {
                    if(minSamples.length < 12) {
                        minSamples.push(sample);
                    } else {
                        break;
                    }
                }
            }
            
            console.log('gc len');
            console.log(garbageCollect.length);
            for(i = 0; i < garbageCollect.length; i++) {
                this.samples.splice(garbageCollect[i] - i, 1);
            }

            var avg = 0;
            if(minSamples.length) {
                for(i = 0; i < minSamples.length; i++) {
                    avg += minSamples[i].volume;
                }
                avg /= minSamples.length;
            }

            return avg;
        },

    });
    
    var ChatSessionProxy = proxy.Proxy.extend({

        name: function() {
            return ChatSessionProxy.NAME;
        },

        initialize: function(options) {
            this.apiKey = options.apiKey;
            this.sessionToken = options.sessionToken;
            this.userToken = options.userToken;
            this.streams = {};

            this.usersProxy = new user_proxies.ChatUsersProxy({
                collection: new user_models.ChatUserCollection(),
            });
            this.facade.registerProxy(this.usersProxy);
            
            this.session =  TB.initSession(this.sessionToken);

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
            this.facade.trigger(notifications.SESSION_CONNECTED, {
                event: event,
            });

            for(var i = 0; i < event.connections.length; i++) {
                var connection = event.connections[i];
                var connectionData = JSON.parse(connection.data);
                var user = this.usersProxy.get(connectionData.id);
                user.setConnected(true);
            }

            for(var i = 0; i < event.streams.length; i++) {
                var stream = event.streams[i];
                var connectionData = JSON.parse(stream.connection.data);
                
                var user = this.usersProxy.get(connectionData.id);
                user.setStream(stream);
                user.setPublishing(true);
                this.streams[stream.streamId] = new Stream({
                    user: user
                });
            }

        },

        connectionCreatedHandler: function(event) {
            this.facade.trigger(notifications.SESSION_CONNECTION_CREATED, {
                event: event,
            });

            for(var i = 0; i < event.connections.length; i++) {
                var connection = event.connections[i];
                var connectionData = JSON.parse(connection.data);

                var user = this.usersProxy.get(connectionData.id);
                user.setConnected(true);
            }
        },

        connectionDestroyedHandler: function(event) {
            this.facade.trigger(notifications.SESSION_CONNECTION_DESTROYED, {
                event: event,
            });

            for(var i = 0; i < event.connections.length; i++) {
                var connection = event.connections[i];
                var connectionData = JSON.parse(connection.data);

                var user = this.usersProxy.get(connectionData.id);
                user.setConnected(false);
            }

        },

        streamCreatedHandler: function(event) {
            this.facade.trigger(notifications.SESSION_STREAM_CREATED, {
                event: event,
            });

            for(var i = 0; i < event.streams.length; i++) {
                var stream = event.streams[i];
                var connectionData = JSON.parse(stream.connection.data);
                
                var user = this.usersProxy.get(connectionData.id);
                user.setStream(stream);
                user.setPublishing(true);
                this.streams[stream.streamId] = new Stream({
                    user: user
                });
            }
        },

        streamDestroyedHandler: function(event) {
            this.facade.trigger(notifications.SESSION_STREAM_DESTROYED, {
                event: event,
            });

            for(var i = 0; i < event.streams.length; i++) {
                var stream = event.streams[i];
                var connectionData = JSON.parse(stream.connection.data);
                
                var user = this.usersProxy.get(connectionData.id);
                user.setStream(null);
                user.setPublishing(false);
                delete this.streams[stream.streamId];
            }
        },

        microphoneLevelHandler: function(event) {
            var stream = this.streams[event.streamId];
            var average = stream.average();

            console.log('vol');
            console.log(event.volume);
            console.log('avg');
            console.log(average);

            if(event.volume > average + 1) {
                stream.user.setSpeaking(true);
                console.log('speaking');
            } else {
                stream.user.setSpeaking(false);
            }

            stream.addSample(new StreamSample({
                volume: event.volume
            }));
        },

    }, {

        NAME: 'ChatSessionProxy',
    });

    return {
        ChatSessionProxy: ChatSessionProxy,
    }
});
