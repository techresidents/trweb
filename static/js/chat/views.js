define([
    'jQuery',
    'Underscore',
    'Backbone',
    'chat/models',
    'chat/messages',
    'whiteboard/views',
    'whiteboard/serialize',
], function($, _, Backbone, models, messages, whiteboard, serialize) {

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

    var ChatTagItemView = Backbone.View.extend({
            tagName: "li",

            template: _.template($("#tag-item-template").html()),

            initialize: function() {
                this.model = this.options.model;
            },
            
            render: function() {
                $(this.el).html(this.template(this.model.toJSON()));
                return this;
            }
    });

    
    var ChatTagView = Backbone.View.extend({

            el: $("#tags"),

            events: {
                "click button": "addTag",
                "keypress #taginput": "updateOnEnter"
            },

            initialize: function() {
                this.chatSessionToken = this.options.chatSessionToken;
                this.userId = this.options.userId;
                this.chatMessageCollection = this.options.chatMessageCollection;
                this.chatMessageCollection.bind("reset", this.reset, this);
                this.chatMessageCollection.bind("add", this.added, this);

                this.taglist = this.$("#taglist");
                this.tagInput = this.$("#taginput");
            },

            reset: function() {
            },

            added: function(model) {
                if(model.msgType() != "tag") {
                    return;
                }

                this.taglist.append(new ChatTagItemView({model: model}).render().el);

                //scroll to bottom
                this.taglist.animate({scrollTop: 1000}, 800);
            },

            addTag: function() {
                var value = this.tagInput.val();

                if(value) {
                    var header = new messages.ChatMessageHeader({
                        chatSessionToken: this.chatSessionToken,
                        userId: this.userId
                    });

                    var msg = new messages.ChatTagMessage({
                        name: this.tagInput.val()
                    });

                    var message = new models.ChatMessage({
                            header: header,
                            msg: msg
                    });

                    message.save();

                    this.tagInput.val("");
                    this.tagInput.focus();

                    //scroll to bottom
                    this.taglist.animate({scrollTop: 1000}, 800);

                } else {
                    this.tagInput.focus();
                }
            },

            updateOnEnter: function(e) {
                if(e.keyCode == 13) {
                    this.addTag();
                }
            }
    });


    var ChatWhiteboardView = whiteboard.WhiteboardView.extend({

            initialize: function() {
                whiteboard.WhiteboardView.prototype.initialize.call(this);

                this.chatSessionToken = this.options.chatSessionToken;
                this.userId = this.options.userId;
                this.chatMessageCollection = this.options.chatMessageCollection;
                this.chatMessageCollection.bind("reset", this.reset, this);
                this.chatMessageCollection.bind("add", this.added, this);
                
                this.serializer = new serialize.Serializer();
            },

            reset: function() {
            },

            added: function(model) {
                if(model.msgType() != "whiteboard") {
                    return;
                }
                
                var msg = model.get("msg");
                this.paper.add(this.serializer.deserializeElement(msg.data));
            },

            onElementAdded: function(tool, element) {
                whiteboard.WhiteboardView.prototype.onElementAdded.call(this, tool, element);

                var header = new messages.ChatMessageHeader({
                        chatSessionToken: this.chatSessionToken,
                        userId: this.userId
                });

                var msg = new messages.ChatWhiteboardMessage({
                        data: this.serializer.serializeElement(element)
                });


                var message = new models.ChatMessage({
                        header: header,
                        msg: msg
                });

                message.save();
                //element.remove();
            }
    });


    return {
        ChatTagView: ChatTagView,
        ChatTagItemView: ChatTagItemView,
        ChatUserView: ChatUserView,
        ChatWhiteboardView: ChatWhiteboardView,
    }
});
