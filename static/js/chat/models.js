define([
    'jQuery',
    'Underscore',
    'Backbone',
    'xd/xd',
    'xd/backbone',
    'chat/messages',
], function($, _, Backbone, xd, xdBackbone, messages) {

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
                    sessionToken: null,
                    userToken: null,
                    session: null,
                    users: null,
                }
            },

            initialize: function(model) {
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
           
            //connect tokbox session to start everything.
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
                this.trigger("microphone:changed", event);
            }

    });

    var ChatMessage = Backbone.Model.extend({

            defaults: function() {
                return {
                    header: null,
                    msg: null
                };
            },

            initialize: function(attributes, options) {

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
                return this.header().url() + this.msg().url();
            },

            toJSON: function() {
                return _.extend({}, this.header(), this.msg());
            },
            
            parse: function(response) {
                return {
                    id: response.header.id,
                    header: new messages.MessageHeader(response.header),
                    msg: messages.messageFactory.create(response.header, response.msg)
                };
            },

            sync: xdBackbone.sync,

            msgType: function() {
                var header = this.get("header");
                if(header) {
                    return header.type;
                } else {
                    return null;
                }
            }
    });

    var ChatMessageCollection = Backbone.Collection.extend({
            model: ChatMessage,
            
            url: "/chat/messages",

            initialize: function(models, options) {
                this.chatSessionToken = options.chatSessionToken;
                this.userId = options.userId;
                
                //define long poll callback outside of longPoll function
                //to cut down on memory usage since this function is
                //call frequently.
                var that=this;
                this.longPollCallback = function() {
                    that.longPoll.call(that);
                };
            },

            sync: function(method, collection, options) {
                if(method == 'read') {
                    var last = this.last();
                    var asOf = last ? last.attributes.header.timestamp : 0;

                    var data = {
                        chatSessionToken: this.chatSessionToken,
                        userId: this.userId,
                        asOf: asOf
                    };

                    options.data = data;
                }

                return xdBackbone.sync(method, collection, options);
            },

            longPollCallback: function() {
            },

            longPoll: function() {
                this.fetch({add: true, silent: false, complete: this.longPollCallback});
            }
    });

    return {
        ChatSession: ChatSession,
        ChatUserCollection: ChatUserCollection,
        ChatMessage: ChatMessage,
        ChatMessageCollection: ChatMessageCollection,
    }
});
