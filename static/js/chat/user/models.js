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
                stream: null,
                isSpeaking: false,
                isConnected: false,
                isPublishing: false,
                imageUrl: null,
                participant: null,
            };
        },

        name: function() {
            return this.get("name");
        },

        stream: function() {
            return this.get("stream");
        },

        setStream: function(stream) {
            this.set({ stream: stream });
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
        
        participant: function() {
            return this.get("participant");
        },

        setParticipant: function(participant) {
            this.set({participant: participant});
            return this;
        },

        style: function() {
            return "participant" + this.participant();
        },

        isCurrentUser: function() {
            var result = false;
            if(this.collection) {
                result = this.collection.first().id === this.id;
            } 
            return result;
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
        ChatUserCollection: ChatUserCollection,
    }
});
