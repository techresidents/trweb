define([
    'jquery',
    'underscore',
    'backbone',
    'api'
], function($, _, Backbone, api) {
    
    /**
     * User State
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var UserState = Backbone.Model.extend({

        STATUS: {
            UNAVAILABLE: 'UNAVAILABLE',
            DISCONNECTED: 'DISCONNECTED',
            CONNECTED: 'CONNECTED'
        },

        defaults: function() {
            return {
                userId: null,
                status: this.STATUS.UNAVAILABLE,
                firstName: null,
                participant: null
            };
        },

        userId: function() {
            return this.get('userId');
        },

        setUserId: function(userId) {
            this.set('userId', userId);
            return this;
        },

        status: function() {
            return this.get('status');
        },

        setStatus: function(status) {
            this.set('status', status);
            return this;
        },

        firstName: function() {
            return this.get('firstName');
        },

        setFirstName: function(firstName) {
            this.set('firstName', firstName);
            return this;
        },

        participant: function() {
            return this.get('participant');
        },

        setParticipant: function(participant) {
            this.set('participant', participant);
            return this;
        }
    });

    /**
     * User State Collection
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var UserStateCollection = Backbone.Collection.extend({
        model: UserState
    });

    /**
     * Chat State.
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var ChatState = Backbone.Model.extend({

        STATUS: {
            PENDING: 'PENDING',
            STARTED: 'STARTED',
            ENDED: 'ENDED'
        },
            
        defaults: function() {
            return {
                chat: null,
                users: new UserStateCollection(),
                status: this.STATUS.PENDING
            };
        },

        initialize: function() {
            this.currentUser = new api.models.User({
                id: 'CURRENT'
            });
        },

        chat: function() {
            return this.get('chat');
        },

        setChat: function(chat) {
            this.set('chat', chat);
            return this;
        },

        users: function() {
            return this.get('users');
        },

        setUsers: function(users) {
            this.set('users', users);
            return this;
        },

        status: function() {
            return this.get('status');
        },

        setStatus: function(status) {
            this.set('status', status);
            return this;
        },
        
        credential: function() {
            var result;
            var chat = this.chat();
            if(chat) {
                result = chat.get_chat_credentials().first();
            }
            return result;
        },
        
        currentParticipant: function() {
            var result;
            var chat = this.chat();
            if(chat) {
                result = _.first(chat.get_chat_participants().where({
                    user_id: this.currentUser.id
                }));
            }
            return result;
        },

        currentUser: function() {
            return _.first(this.users().where({
                userId: this.currentUser.id
            }));
        }
    });

    return {
        ChatState: ChatState,
        UserState: UserState,
        UserStateCollection: UserStateCollection
    };
});
