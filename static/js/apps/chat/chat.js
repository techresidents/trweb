define([
    'jQuery',
    'Underscore',
    'Backbone',
    'Highcharts'
], function($, _, Backbone, Highcharts) {

$(document).ready(function() {
    
    var ChatUser = Backbone.Model.extend({

            defaults: function() {
                return {
                    name: "",
                    isSpeaking: false,
                    isConnected: false,
                    isPublishing: false
                };
            },

            name: function() {
                return this.get("name");
            },

            isSpeaking: function() {
                return this.get("isSpeaking");
            },

            setSpeaking: function(isSpeaking) {
                this.set({ isSpeaking: isSpeaking });
                return this;
            },

            isConnected: function() {
                return this.get("isConnected");
            },

            setConnected: function(isConnected) {
                this.set({ isConnected: isConnected });
                return this;
            },

            isPublishing: function() {
                return this.get("isPublishing");
            },

            setPublishing: function(isPublishing) {
                this.set({ isPublishing: isPublishing });
                return this;
            }
    });

    var ChatUserCollection = Backbone.Collection.extend({
            model: ChatUser
    });

    var ChatSession = Backbone.Model.extend({
            defaults: function() {
                return {
                    apiKey: null,
                    sessionId: null,
                    sessionToken: null,
                    session: null,
                    users: null,
                }
            },

            initialize: function(model) {
                //make 'this' available for tokbox event listeners
                var that = this;

                var session =  TB.initSession(model.sessionId);
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

            getSessionId: function() {
                return this.get("sessionId");
            },

            getSessionToken: function() {
                return this.get("sessionToken");
            },

            getSession: function() {
                return this.get("session");
            },

            getUsers: function() {
                return this.get("users");
            },
           
            //connect tokbox session to start everything.
            connect: function() {
                var session = this.getSession();
                var sessionToken = this.getSessionToken();
                var apiKey = this.getApiKey();
                
                session.connect(apiKey, sessionToken);
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
                this.trigger("microphone:changed", event);
            }

    });

    var ChatUserView = Backbone.View.extend({
            tagName: "div",
            
            //Templates need to be structured this way since the video player
            //will replace the user-template when video is streaming.
            templateHeader: _.template($("#chat-user-header-template").html()),

            template: _.template($("#chat-user-template").html()),

            templateFooter: _.template($("#chat-user-footer-template").html()),
            
            user: null,

            initialize: function() {
                this.user = this.options.model;
                this.chatSession = this.options.chatSession;
                this.css = this.options.css;
                
                //bind events
                this.user.bind("change", this.render, this);
                this.chatSession.bind("session:connected", this.sessionConnected, this);
                this.chatSession.bind("connection:created", this.connectionCreated, this);
                this.chatSession.bind("connection:destroyed", this.connectionDestroyed, this);
                this.chatSession.bind("stream:created", this.streamCreated, this);
                this.chatSession.bind("stream:destroyed", this.streamDestroyed, this);
                this.chatSession.bind("microphone:changed", this.microphoneChanged, this);
            },

            render: function() {
                //if not already connected it's safe to render all of the templates.
                //if we are conncted than tokbox will have replaced elements in 
                //the chat-user-template with the video player, so we can no longer
                //re-render it.
                if(!this.user.isConnected()) {
                    var json = this.model.toJSON();
                    var html = this.templateHeader(json) + this.template(json) + this.templateFooter(json);
                    $(this.el).html(html);
                    $(this.el).addClass(this.css);
                } else {
                    this.$("#user" + this.user.id + "-header").html(this.templateHeader(this.model.toJSON()));
                    this.$("#user" + this.user.id + "-footer").html(this.templateFooter(this.model.toJSON()));
                }
                return this;
            },

            //Server side associated a JSON object with each connection
            //containing user details (id, etc...). This allows us to
            //determine which connection is associated with this view
            //by comparing the view's user.id with connection user id.
            filterConnections: function(connections) {
                var session = this.chatSession.getSession();

                for(var i = 0; i < connections.length; i++) {
                    var connection = connections[i];
                    if(JSON.parse(connection.data).id == this.user.id) {
                        return connection;
                    }
                }

                return null;
            },

            filterStreams: function(streams) {
                var session = this.chatSession.getSession();

                for(var i = 0; i < streams.length; i++) {
                    var stream = streams[i];

                    if(JSON.parse(stream.connection.data).id == this.user.id) {
                        return stream;
                    }
                }

                return null;
            },

            sessionConnected: function(event) {
                var connection = this.filterConnections(event.connections);
                if(connection) {
                    this.user.setConnected(true);

                    var session = this.chatSession.getSession();
                    if(session.connection.connectionId == connection.connectionId) {
                        session.publish(
                            "user" + this.user.id,
                            { width: 200, height: 200 }
                        );
                    } 

                    this.streamCreated(event);
                }
            },

            connectionCreated: function(event) {
                var connection = this.filterConnections(event.connections);
                if(connection) {
                    this.user.setConnected(true);
                }
            },

            connectionDestroyed: function(event) {
                var connection = this.filterConnections(event.connections);
                if(connection) {
                    this.user.setConnected(false);
                }
            },

            streamCreated: function(event) {
                var stream = this.filterStreams(event.streams);
                if(stream) {
                    var session = this.chatSession.getSession();
                    
                    if(stream.connection.connectionId != session.connection.connectionId) {
                        session.subscribe(
                            stream,
                            "user" + this.user.id,
                            { width: 200, height: 200 }
                        );
                    }

                    this.user.setPublishing(true);
                }
            },

            streamDestroyed: function(event) {
                var stream = this.filterStreams(event.streams);
                if(stream) {
                    this.user.setPublishing(false);
                }
            },

            microphoneChanged: function(event) {
                //console.log(event.volume);
                //console.log(event.target.connection.data);
            }
    });
        

    var ChatAppView = Backbone.View.extend({

            el: $("#chatapp"),

            initialize: function() {
                this.chatUsers = new ChatUserCollection();
                this.chatUsers.reset(this.options.data.users);
                this.chatUsers.bind("change", this.changed, this);
                
                //create chat session (not yet connected)
                this.chatSession = new ChatSession({
                        apiKey: this.options.data.chatAPIKey,
                        sessionId: this.options.data.chatSessionId,
                        sessionToken: this.options.data.chatSessionToken,
                        users: this.chatUsers
                });
                
                //create a view for each user
                this.chatUsers.each(function(user) {
                    var chatUserView = new ChatUserView({
                            model: user,
                            id: user.id,
                            chatSession: this.chatSession,
                            css: "span" + 16/this.chatUsers.length
                    });
                    this.$("#chat").append(chatUserView.render().el);
                }, this);
                
                //connect the chat session
                this.chatSession.connect();
            },

            changed: function(user) {
            }
    });

    app = new ChatAppView({data: data});

});

    
});
