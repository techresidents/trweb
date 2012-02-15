define([
    'jQuery',
    'Underscore',
    'Backbone',
    'easyXDM',
], function($, _, Backbone, easyXDM) {

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


                this.xhr = new easyXDM.Rpc({
                        remote: "http://localdev:6767/static/js/easyXDM/cors/index.html"
                }, {
                    remote: {
                        request: {}
                    }
                });
            },

            header: function() {
                return this.get("header");
            },

            msg: function() {
                return this.get("msg");
            },
            
            url: function() {
                return "/chat/message/" + this.attributes.header.type;
            },

            toJSON: function() {
                return _.extend({}, this.attributes.header, this.attributes.msg);
            },

            sync: function(method, model, options) {
                var data = model.toJSON();

                this.xhr.request({
                    url: this.url(),
                    method: "POST",
                    timeout: 60000,
                    data: data,
                }, function(response) {
                    options.success(JSON.parse(response.data), response.status);
                }, function(response) {
                    options.error(response.data.data, response.data.status);
                }
                );
            }
    });

    var ChatMessageCollection = Backbone.Collection.extend({
            model: ChatMessage,
            
            url: "/chat/messages",

            initialize: function(models, options) {
                this.chatSessionId = options.chatSessionId;
                this.userId = options.userId;
                
                this.xhr = new easyXDM.Rpc({
                        remote: "http://localdev:6767/static/js/easyXDM/cors/index.html"
                }, {
                    remote: {
                        request: {}
                    }
                });
            },

            sync: function(method, collection, options) {
                var last = this.last();
                var asOf = last ? last.attributes.header.timestamp : 0;

                var data = {
                    chatSessionId: this.chatSessionId,
                    userId: this.userId,
                    asOf: asOf
                };

                this.xhr.request({
                    url: this.url,
                    method: "POST",
                    timeout: 60000,
                    data: data,
                }, function(response) {
                    options.success(JSON.parse(response.data), response.status);
                    if(options.complete) {
                        options.complete();
                    }
                }, function(response) {
                    options.error(response.data.data, response.data.status);
                    if(options.complete) {
                        options.complete();
                    }
                }
                );
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


    return {
        ChatSession: ChatSession,
        ChatUserCollection: ChatUserCollection,
        ChatMessage: ChatMessage,
        ChatMessageHeader: ChatMessageHeader,
        ChatTagMessage: ChatTagMessage,
        ChatMessageCollection: ChatMessageCollection
    }
});
