define([
    'underscore',
    'common/notifications',
    'core/array',
    'core/base',
    'core/proxy',
    'chat/user/models',
    'chat/user/proxies'
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
        }
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
            
            var i;
            //Find the smallest non-expired samples (minSampleSize many)
            for(i = 0; i < this.samples.length; i++) {
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
        }

    });
   
    /**
     * Chat Session Proxy
     * @constructor
     * @param {Object} options
     *   {string} sessionId Chat Session Id
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
            this.sessionId = options.sessionId;
            this.apiKey = options.apiKey;
            this.sessionToken = options.sessionToken;
            this.userToken = options.userToken;

            //user id to Stream map
            this.streams = {};
            
            //create and register ChatUsersProxy
            this.usersProxy = new user_proxies.ChatUsersProxy({
                collection: new user_models.ChatUserCollection()
            });
            this.facade.registerProxy(this.usersProxy);
            
            //initialize Tokbox session / archive
            this.session =  TB.initSession(this.sessionToken);
            this.archive = null;
            this.perSessionRecording = true; //perSession or perStream
            this.record = false;    //target recording status
            this.recording = false; //current recording status
            
            //add Tokbox event handlers
            this.session.addEventListener("sessionConnected", _.bind(this.sessionConnectedHandler, this));
            this.session.addEventListener("connectionCreated", _.bind(this.connectionCreatedHandler, this));
            this.session.addEventListener("connectionDestroyed", _.bind(this.connectionDestroyedHandler, this));
            this.session.addEventListener("streamCreated", _.bind(this.streamCreatedHandler, this));
            this.session.addEventListener("streamDestroyed", _.bind(this.streamDestroyedHandler, this));
            this.session.addEventListener("microphoneLevelChanged", _.bind(this.microphoneLevelHandler, this));
            this.session.addEventListener("archiveCreated", _.bind(this.archiveCreatedHandler, this));
            this.session.addEventListener("archiveClosed", _.bind(this.archiveClosedHandler, this));
            this.session.addEventListener("sessionNotRecording", _.bind(this.sessionNotRecordingHandler, this));
            this.session.addEventListener("sessionRecordingInProgress", _.bind(this.sessionRecordingInProgressHandler, this));
            this.session.addEventListener("sessionRecordingStarted", _.bind(this.sessionRecordingStartedHandler, this));
            this.session.addEventListener("sessionRecordingStopped", _.bind(this.sessionRecordingStoppedHandler, this));
            this.session.addEventListener("streamNotRecording", _.bind(this.streamNotRecordingHandler, this));
            this.session.addEventListener("streamRecordingInProgress", _.bind(this.streamRecordingInProgressHandler, this));
            this.session.addEventListener("streamRecordingStarted", _.bind(this.streamRecordingStartedHandler, this));
            this.session.addEventListener("streamRecordingStopped", _.bind(this.streamRecordingStoppedHandler, this));
        },

        _getOrCreateUser: function(connectionData) {
            var id = connectionData.id;
            var user = this.usersProxy.get(id);
            if(!user) {
                this.usersProxy.add(connectionData);
                user = this.usersProxy.get(id);
            }
            return user;
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

        /**
         * Disconnect chat session.
         */
        disconnect: function() {
            if(this.recording) {
                this.stopRecording();
            }

            if(this.archive) {
                this.session.closeArchive(this.archive);
            }
            
            if(this.session.connected) {
                this.session.disconnect();
                this.session.cleanup();
            }
        },

        startRecording: function() {
            this.record = true;

            if(this.session.connected && !this.recording) {
                if(!this.archive) {
                    this.session.createArchive(
                            this.getApiKey(),
                            this.perSessionRecording ? 'perSession' : 'perStream',
                            this.sessionId);
                } else {

                    this.facade.trigger(notifications.SESSION_RECORDING_STARTED, {
                        archive: this.archive
                    });

                    if(this.perSessionRecording) {
                        this.session.startRecording(this.archive);
                    } else {
                        var stream = this.getCurrentUser().stream();
                        if(stream) {
                            this.getCurrentUser().stream().startRecording(this.archive);
                        }
                    }
                }
            }
        },

        stopRecording: function() {
            this.record = false;
            if(this.recording) {

                this.facade.trigger(notifications.SESSION_RECORDING_ENDED, {
                    archive: this.archive
                });

                if(this.perSessionRecording) {
                    this.session.stopRecording(this.archive);
                } else {
                    var stream = this.getCurrentUser().stream();
                    if(stream) {
                        this.getCurrentUser().stream().stopRecording(this.archive);
                    }
                }
            }
        },

        sessionConnectedHandler: function(event) {
            var i, connection, connectionData, stream;

            //store the tokbox session archive prior to dispatching
            //the SESSION_CONNECTED notification, since this is likely
            //to trigger the start of the recording which will require
            //the archive.

            if(event.archives.length) {
                this.archive = event.archives[0];
            } 
            
            this.facade.trigger(notifications.SESSION_CONNECTED, {
                event: event
            });

            for(i = 0; i < event.connections.length; i++) {
                connection = event.connections[i];

                //connection data set on server side
                connectionData = JSON.parse(connection.data);
                user = this._getOrCreateUser(connectionData);
                user.setConnected(true);
            }

            for(i = 0; i < event.streams.length; i++) {
                stream = event.streams[i];
                connectionData = JSON.parse(stream.connection.data);
                user = this._getOrCreateUser(connectionData);
                user.setStream(stream);
                user.setPublishing(true);
                this.streams[stream.streamId] = new Stream({
                    user: user
                });
            }
            
            //start recording if requested and we're not already recording.
            //this will start recording for perSession type recording.
            //perStream recording cannot be initiated until the
            //stream is created (which happens after this event)
            if(this.record && !this.recording) {
                this.startRecording();
            }
        },

        connectionCreatedHandler: function(event) {
            var i;

            this.facade.trigger(notifications.SESSION_CONNECTION_CREATED, {
                event: event
            });
            
            for(i = 0; i < event.connections.length; i++) {
                var connection = event.connections[i];

                //connection data set on server side
                var connectionData = JSON.parse(connection.data);

                var user = this._getOrCreateUser(connectionData);
                user.setConnected(true);
            }
        },

        connectionDestroyedHandler: function(event) {
            var i;

            this.facade.trigger(notifications.SESSION_CONNECTION_DESTROYED, {
                event: event
            });
            
            for(i = 0; i < event.connections.length; i++) {
                var connection = event.connections[i];

                //connection data set on server side
                var connectionData = JSON.parse(connection.data);

                var user = this.usersProxy.get(connectionData.id);
                user.setConnected(false);
            }

        },

        streamCreatedHandler: function(event) {
            var i;

            this.facade.trigger(notifications.SESSION_STREAM_CREATED, {
                event: event
            });

            for(i = 0; i < event.streams.length; i++) {
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

            //start recording if requested and we're not already recording.
            //this will start recording for perStream type recording.
            if(this.record && !this.recording) {
                this.startRecording();
            }
        },

        streamDestroyedHandler: function(event) {
            var i, connectionData, stream;

            this.facade.trigger(notifications.SESSION_STREAM_DESTROYED, {
                event: event
            });

            for(i = 0; i < event.streams.length; i++) {
                stream = event.streams[i];

                //connection data set on server side
                connectionData = JSON.parse(stream.connection.data);
                
                var user = this.usersProxy.get(connectionData.id);
                user.setStream(null);
                user.setPublishing(false);
                delete this.streams[stream.streamId];
            }
        },


        /* Internal handlers which do not trigger notifications */

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

        archiveCreatedHandler: function(event) {
            this.archive = event.archives[0];
            if(this.record && !this.recording) {
                this.startRecording();
            }
        },

        archiveClosedHandler: function(event) {
            this.archive = null;
        },

        sessionNotRecordingHandler: function(event) {
            this.recording = false;
        },

        sessionRecordingInProgressHandler: function(event) {
            this.recording = true;
        },

        sessionRecordingStartedHandler: function(event) {
            this.recording = true;
        },

        sessionRecordingStoppedHandler: function(event) {
            this.recording = false;
        },

        streamNotRecordingHandler: function(event) {
            this.recording = false;
        },

        streamRecordingInProgressHandler: function(event) {
            this.recording = true;
        },

        streamRecordingStartedHandler: function(event) {
            this.recording = true;
        },

        streamRecordingStoppedHandler: function(event) {
            this.recording = false;
        }

    }, {

        NAME: 'ChatSessionProxy'
    });

    return {
        ChatSessionProxy: ChatSessionProxy
    };
});
