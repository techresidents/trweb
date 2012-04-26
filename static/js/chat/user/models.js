define([
    'jQuery',
    'Underscore',
    'Backbone',
], function($, _, Backbone) {
    
    /**
     * Chat user model.
     * @constructor
     */
    var ChatUser = Backbone.Model.extend({

        defaults: function() {
            return {
                name: "",
                streamId: null,
                isSpeaking: false,
                isConnected: false,
                isPublishing: false
            };
        },

        name: function() {
            return this.get("name");
        },

        streamId: function() {
            return this.get("streamId");
        },

        setStreamId: function(streamId) {
            this.set({ streamId: streamId });
            return this;
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
        },

        style: function() {
            return "user" + this.id;
        },
    });


    /**
     * Chat user collection.
     * @constructor
     */
    var ChatUserCollection = Backbone.Collection.extend({

        localStorage: new Backbone.LocalStorage("ChatUserCollection"),

        model: ChatUser
    });

    return {
        users: new ChatUserCollection,
        currentUser: new ChatUser,
    }
});
