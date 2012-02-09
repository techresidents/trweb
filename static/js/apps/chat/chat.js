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

    var ChatMessage = Backbone.Model.extend({

            messageTypeMap: {
                "tag": ChatTagMessage
            },

            defaults: function() {
                return {
                    header: null,
                    msg: null
                };
            },

            initialize: function(attributes, options) {

                if(attributes.header.constructor == Object) {
                    attributes.header = new ChatMessageHeader(attributes.header);
                }

                if(attributes.msg.constructor == Object) {
                    var constructor = this.messageTypeMap[attributes.msg.type]
                    if(constructor) {
                        attributes.msg = new constructor(attributes.msg);
                    }
                }

                if(!attributes.header.type && attributes.msg.type) {
                    attributes.header.type = attributes.msg.type;
                }
            },

            header: function() {
                return this.get("header");
            },

            msg: function() {
                return this.get("msg");
            },
            
            url: function() {
                return "http://localdev:6767/chat/message/" + this.attributes.header.type;
            },

            toJSON: function() {
                return _.extend({}, this.attributes.header, this.attributes.msg);
            },

            sync: function(method, model, options) {
                options.type = "GET";
                options.data = model.toJSON();
                options.dataType = "jsonp";
                return Backbone.sync(method, model, options);
            }
    });

    var ChatMessageCollection = Backbone.Collection.extend({
            model: ChatMessage,
            
            url: "http://localdev:6767/chat/messages",

            initialize: function(models, options) {
                this.chatSessionId = options.chatSessionId;
                this.userId = options.userId;
            },

            sync: function(method, collection, options) {
                var last = this.last();
                var asOf = last ? last.attributes.header.timestamp : 0;

                options.type = "GET";
                options.dataType = "jsonp";
                options.data = {
                    chatSessionId: this.chatSessionId,
                    userId: this.userId,
                    asOf: asOf
                };
                return Backbone.sync(method, collection, options);
            },

            longPoll: function() {
                var that = this;
                this.fetch({add: true, silent: false, complete: function() { that.longPoll.call(that);} });
            }
    });

    var ChatMessageHeader = function(attributes) {
        this.id = null;
        this.type = null;
        this.chatSessionId = null;
        this.userId = null;
        this.timestamp = null;

        _.extend(this, attributes);
    };


    var ChatTagMessage = function(attributes) {
        this.type = "tag";
        this.name = null;

        _.extend(this, attributes);
    };


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
            tag: "li",

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
                this.chatSessionId = this.options.chatSessionId;
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
                this.taglist.append(new ChatTagItemView({model: model}).render().el);

                //scroll to bottom
                this.taglist.animate({scrollTop: 1000}, 800);
            },

            addTag: function() {
                var value = this.tagInput.val();

                if(value) {
                    var header = new ChatMessageHeader({
                        chatSessionId: this.chatSessionId,
                        userId: this.userId
                    });

                    var msg = new ChatTagMessage({
                        name: this.tagInput.val()
                    });

                    var message = new ChatMessage({
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


                var chatMessageCollection = new ChatMessageCollection(null, {
                        chatSessionId: this.options.data.chatSessionId,
                        userId: this.chatUsers.first().id
                });

                //create tag view
                var chatTagView = new ChatTagView({
                        chatSessionId: this.options.data.chatSessionId,
                        userId: this.chatUsers.first().id,
                        chatMessageCollection: chatMessageCollection});

                //long poll
                chatMessageCollection.longPoll();
            },

            changed: function(user) {
            }
    });

    app = new ChatAppView({data: data});

});

    
});
