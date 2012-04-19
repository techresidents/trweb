define([
    'jQuery',
    'Underscore',
    'Backbone',
    'spin',
], function($, _, Backbone, spin) {

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
                    this.$el.html(html);
                    this.$el.addClass(this.css);
                    
                    if(this.user.id == this.chatSession.getCurrentUser().id) {
                        this.spinner = new spin.Spinner({left: 200, top: 100}).spin(this.el);
                    }

                } else {

                    if(this.user.id == this.chatSession.getCurrentUser().id) {
                        this.spinner.stop();
                    }

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
                        var container = this.$('.chat-user-container');
                        session.publish( "user" + this.user.id, {
                                width: container.width(),
                                height: container.height(),
                                encodedWidth: container.width(),
                                encodedHeight: container.height(),
                                reportMicLevels: true
                        });
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
                    this.user.setStreamId(stream.streamId);

                    if(stream.connection.connectionId != session.connection.connectionId) {
                        var container = this.$('.chat-user-container');
                        session.subscribe(
                            stream,
                            "user" + this.user.id,
                            { width: container.width(), height: container.height() }
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
                console.log(event.volume);
                this.$('.chat-user-container').addStyle('speaking');
                //console.log(event.volume);
                //console.log(event.target.connection.data);
            }
    });


    return {
        ChatUserView: ChatUserView,
    }
});
