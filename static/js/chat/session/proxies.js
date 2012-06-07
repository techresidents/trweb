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
    
    /**
     * Chat Stream Sample
     * @constructor
     * @param {Object} options
     *   {string} optional sample id
     *   {number} volume
     *   {number} timestamp seconds since epoch
     *
     * Represents a sample from one the chat steams.
     * Each samples captures the microphone level.
     */
    var StreamSample = base.Base.extend({
        initialize: function(options) {
            this.id = options.id || _.uniqueId('StreamSample_');
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

    /**
     * Chat Stream
     * @constructor
     * @param {Object} options
     *   {integer} period sampling period in seconds
     *
     * Represents a chat stream and a small history of StreamSample
     * objects. These samples are used to determine the average
     * minimum microhpone volume for last period seconds.
     * 
     * This average is extremely useful for determining if
     * a user is speaking or not.
     */
    var Stream = base.Base.extend({

        initialize: function(options) {
            this.period = options.period || 60;

            //max samples to keep
            this.maxSamples = this.period * 2;

            //minimum number of samples needed to compute
            //minimum microhpone volume average
            this.minSampleSize = this.maxSamples / 10;

            //StreamSample's sorted by volume
            this.samples = [];

            this.user = options.user;
        },
        
        /**
         * Add a Stream sample
         * @param {StreamSample} sample
         */
        addSample: function(sample) {
            //insert StreamSample into samples array and keep sorted by volume
            array.binaryInsert(this.samples, sample, sample.compareVolume);

            //make sure we store at most maxSamples
            if(this.samples.length > this.maxSamples) {
                this.samples.pop();
            }
        },
        
        /**
         * Compute the minimum microhpone volume average for current period
         * @return {number}
         */
        minVolumeAverage: function() {
            //skip StreamSample's with a timestamp greater than this
            var expiredTimestamp = (new Date().valueOf() / 1000) - this.period;
            
            //Samples with the smallest volumes
            var minSamples = [];

            //Expried samples that need to be removed
            var garbageCollect = [];
            
            //Find the smallest non-expired samples (minSampleSize many)
            for(var i = 0; i < this.samples.length; i++) {
                var sample = this.samples[i];

                //if the sample is expired, skip it and add it gc
                if(sample.timestamp < expiredTimestamp) {
                    garbageCollect.push(i);
                } else {
                    if(minSamples.length < this.minSampleSize) {
                        minSamples.push(sample);
                    } else {
                        break;
                    }
                }
            }
            
            //clean up gc samples
            for(i = 0; i < garbageCollect.length; i++) {
                this.samples.splice(garbageCollect[i] - i, 1);
            }
            
            //compute the min microhpone average volume
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
   
    /**
     * Chat Session Proxy
     * @constructor
     * @param {Object} options
     *   {string} apiKey Tokbox API Key
     *   {string} sessionToken Tokbox session token
     *   {string} userToken Tokbox user token
     *
     * Maintains chat session and converts Tokbox events
     * into system notifications.
     */
    var ChatSessionProxy = proxy.Proxy.extend({

        name: function() {
            return ChatSessionProxy.NAME;
        },

        initialize: function(options) {
            this.apiKey = options.apiKey;
            this.sessionToken = options.sessionToken;
            this.userToken = options.userToken;

            //user id to Stream map
            this.streams = {};
            
            //create and register ChatUsersProxy
            this.usersProxy = new user_proxies.ChatUsersProxy({
                collection: new user_models.ChatUserCollection(),
            });
            this.facade.registerProxy(this.usersProxy);
            
            //initialize Tokbox session
            this.session =  TB.initSession(this.sessionToken);
            
            //add Tokbox event handlers
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
        
        /**
         * Get the current user.
         * @return {User}
         */
        getCurrentUser: function() {
            //current user is always stored first in collection
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

                //connection data set on server side
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

                //connection data set on server side
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

                //connection data set on server side
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

                //connection data set on server side
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

                //connection data set on server side
                var connectionData = JSON.parse(stream.connection.data);
                
                var user = this.usersProxy.get(connectionData.id);
                user.setStream(null);
                user.setPublishing(false);
                delete this.streams[stream.streamId];
            }
        },

        microphoneLevelHandler: function(event) {
            var stream = this.streams[event.streamId];

            //get the minimum microhpone volume average
            var average = stream.minVolumeAverage();
            
            //tenative threshold comparision to determine
            //if user is speaking.
            if(event.volume > average + 1) {
                if(!stream.user.isSpeaking()) {
                    stream.user.setSpeaking(true);
                }
            } else {
                if(stream.user.isSpeaking()) {
                    stream.user.setSpeaking(false);
                }
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
