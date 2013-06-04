define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'events',
    './models'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    events,
    models) {

    /**
     * Chat Message Pump
     * @constructor
     * @param {Object} options
     */
    var ChatMessagePump = core.base.Base.extend({

        initialize: function(options) {
            options = _.extend({
                errorDelay: 60000,
                maxErrorsBeforeDelay: 3,
                maxErrorsBeforeStop: 10
            }, options);

            this.model = options.model;
            this.errorDelay = options.errorDelay;
            this.maxErrorsBeforeDelay = options.maxErrorsBeforeDelay;
            this.maxErrorsBeforeStop = options.maxErrorsBeforeStop;

            this.credential = this.model.get_chat_credentials().first();
            this.collection = options.collection;
            this.query = this.collection.query().filterBy({
                chat_token: this.credential.get_token()
            });
            this.errors = 0;
            this.running = false;
        },
        
        start: function() {
            this.running = true;
            this.poll();
        },

        stop: function() {
            this.running = false;
            if(this.timerId) {
                clearTimeout(this.timerId);
            }
        },

        poll: function() {
            this.timerId = null;

            this.query.filterBy({
                as_of: this.lastMessageTimestamp()
            }).fetch({
                update: true,
                add: true,    
                merge: false,
                remove: false,
                timeout: 15000,
                success: _.bind(this.onPollSuccess, this),
                error: _.bind(this.onPollError, this)
            });
        },

        onPollSuccess: function() {
            this.errors = 0;

            if(this.running) {
                this.poll();
            }
        },

        onPollError: function() {
            this.errors++;
            if(!this.running) {
                return;
            }
            
            if(this.errors >= this.maxErrorsBeforeStop) {
                this.stop();
            }
            else if(this.errors >= this.maxErrorsBeforeDelay) {
                this.timerId = setTimeout(_.bind(this.poll, this),
                        this.errorDelay);
            } else {
                this.timerId = setTimeout(_.bind(this.poll, this),
                        1000);
            }
        },

        lastMessageTimestamp: function() {
            var result = 0;
            var message = this.collection.last();
            if(message) {
                result = message.get_header().timestamp;
            }
            return result;
        }
    });


    /**
     * Chat Message Handler View
     * @constructor
     * @param {Object} options
     */
    var ChatMessageHandlerView = core.view.View.extend({

        initialize: function(options) {
            this.model = options.model;
            this.currentUser = new api.models.User({
                id: 'CURRENT'
            });
        },

        render: function() {
            return this;
        },

        handle: function(message) {
            var header = message.get_header();

            //update clock skew if not set
            if(header.user_id === this.currentUser.id) {
                if(this.model.skew() === 0) {
                    this.model.setSkew(header.skew);
                }
            }

            switch(header.type) {
                case 'CHAT_STATUS':
                    return this.handleChatStatus(message);
                case 'USER_STATUS':
                    return this.handleUserStatus(message);
            }
        },

        handleChatStatus: function(message) {
            var header = message.get_header();
            var msg = message.get_chat_status_message();
            var attr = {
                status: msg.status
            };
            var timestamp;

            switch(msg.status) {
                case this.model.STATUS.STARTED:
                    timestamp = header.timestamp + this.model.skew();
                    attr.startTime = new Date(timestamp * 1000);
                    break;
                case this.model.STATUS.ENDED:
                    timestamp = header.timestamp + this.model.skew();
                    attr.startTime = new Date(timestamp * 1000);
                    attr.endTime = new Date(header.timestamp * 1000);
                    break;
            }
            this.model.set(attr);
            return true;
        },

        handleUserStatus: function(message) {
            var msg = message.get_user_status_message();
            var user = _.first(this.model.users().where({
                userId: msg.user_id
            }));
            
            //if the message originated from server and is an update
            //on current user status, ignore it. This may happen if
            //the server detects a brief disconnection. If the
            //status on the server does not match our status
            //broadcast it out to sync back up.
            if(message.get_header().user_id === "0" &&
               msg.user_id === this.currentUser.id) {
                if(msg.status !== user.status()) {
                    this.broadcastUserStatus();
                }
                return;
            }

            if(user) {
                user.setStatus(msg.status);

                //status updates from the server will not have
                //first name and participant set. So make sure
                //we don't replace valid values with null.
                if(msg.first_name) {
                    user.setFirstName(msg.first_name);
                }
                if(msg.participant) {
                    user.setParticipant(msg.participant);
                }
            }
            else {
                user = new models.UserState({
                    userId: msg.user_id,
                    status: msg.status,
                    firstName: msg.first_name,
                    participant: msg.participant
                });
                this.model.users().add(user);
            }
            return true;
        },

        broadcastUserStatus: function() {
            var user = _.first(this.model.users().where({
                userId: this.currentUser.id
            }));

            if(user) {
                this.triggerEvent(events.UPDATE_CHAT_USER_STATUS, {
                    chat: this.model.chat(),
                    status: user.status()
                });
            }
        }
    });
    
    return {
        ChatMessagePump: ChatMessagePump,
        ChatMessageHandlerView: ChatMessageHandlerView
    };
});
