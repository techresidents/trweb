define([
    'jQuery',
    'Underscore',
    'Backbone',
    'xd/xd',
    'xd/backbone',
], function($, _, Backbone, xd, xdBackbone) {
    
    /**
     * Chat session model.
     * @constructor
     * @param {Object} attributes Optional model attributes.
     */
    var ChatSession = Backbone.Model.extend({

        localStorage: new Backbone.LocalStorage("ChatSession"),

        defaults: function() {
            return {
                apiKey: null,
                sessionToken: null,
                userToken: null,
                session: null,
                users: null,
            }
        },

        initialize: function(attributes) {
            //make 'this' available for tokbox event listeners
            var that = this;
            
            var session =  TB.initSession(model.sessionToken);
            this.set({ session: session });
            
            //tokbox event listeners defined inline delegate to ChatSession handlers with 'this' set properly.
            session.addEventListener("sessionConnected", function(event) { that.sessionConnectedHandler.call(that, event); });
            session.addEventListener("connectionCreated", function(event) { that.connectionCreatedHandler.call(that, event); });
            session.addEventListener("connectionDestroyed", function(event) { that.connectionDestroyedHandler.call(that, event); });
            session.addEventListener("streamCreated", function(event) { that.streamCreatedHandler.call(that, event); });
            session.addEventListener("streamDestroyed", function(event) { that.streamDestroyedHandler.call(that, event); });
            session.addEventListener("microphoneLevelChanged", function(event) { that.microphoneLevelHandler.call(that, event); });
        },

        getApiKey: function() {
            return this.get("apiKey");
        },

        getSessionToken: function() {
            return this.get("sessionToken");
        },

        getUserToken: function() {
            return this.get("userToken");
        },

        getSession: function() {
            return this.get("session");
        },

        getUsers: function() {
            return this.get("users");
        },
        
        getCurrentUser: function() {
            return this.get("users").first();
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
            this.trigger("session:connected", event);
        },

        connectionCreatedHandler: function(event) {
            this.trigger("connection:created", event);
        },

        connectionDestroyedHandler: function(event) {
            this.trigger("connection:destroyed", event);
        },

        streamCreatedHandler: function(event) {
            this.trigger("stream:created", event);
        },

        streamDestroyedHandler: function(event) {
            this.trigger("stream:destroyed", event);
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
    });

    return {
        ChatSession: ChatSession,
    }
});
