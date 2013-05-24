define([
    'jquery',
    'underscore',
    'backbone',
    'twilio',
    'core',
    'api',
    'events',
    'ui',
    './message',
    './models',
    'text!./templates/chat.html',
    'text!./templates/connection.html',
    'text!./templates/participant.html'
], function(
    $,
    _,
    Backbone,
    Twilio,
    core,
    api,
    events,
    ui,
    message,
    models,
    chat_template,
    connection_template,
    participant_template) {

    /**
     * Chat Participant View
     * @constructor
     * @param {Object} options
     */
    var ChatParticipantView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.model = options.model;
            this.template = _.template(participant_template);

            this.listenTo(this.model, 'change', this.render);
        },

        classes: function() {
            var result = [
                'chat-participant',
                this.model.status().toLowerCase()
            ];
            return result;
        },

        render: function() {
            var context = this.model.toJSON();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        }
    });

    /**
     * Chat Connection View
     * @constructor
     * @param {Object} options
     */
    var ChatConnectionView = core.view.View.extend({

        events: {
            'click .start': 'onStartClick',
            'click .end': 'onEndClick'
        },

        initialize: function(options) {
            this.model = options.model;
            this.credential = this.model.credential();
            this.currentUser = new api.models.User({
                id: 'CURRENT'
            });
            this.template = _.template(connection_template);
            this.twilioConnection = null;

            //bind events
            this.listenTo(this.model, 'change:status', this.onStatusChange);
            this.setup();
        },

        render: function() {
            var context = this.model.toJSON();
            this.$el.html(this.template(context));
            return this;
        },

        setup: function() {
            Twilio.Device.setup(this.credential.get_twilio_capability(), {
                debug: true
            });

            Twilio.Device.cancel(_.bind(this.onTwilioCancel, this));
            Twilio.Device.connect(_.bind(this.onTwilioConnect, this));
            Twilio.Device.connect(_.bind(this.onTwilioDisconnect, this));
            Twilio.Device.error(_.bind(this.onTwilioError, this));
        },

        destroy: function() {
            this.disconnect();
            ChatConnectionView.__super__.destroy.apply(this, arguments);
        },

        connect: function() {
            /*
            if(!this.twilioConnection ||
               this.twilioConnection.status() === 'closed') {
                this.twilioConnection = Twilio.Device.connect({
                    user_id: this.currentUser.id,
                    chat_token: this.credential.get_token()
                });
            }
            */

            this.onTwilioConnect();
        },

        disconnect: function() {
            //Twilio.Device.disconnectAll();
            this.onTwilioDisconnect();
            
        },

        onStatusChange: function() {
            switch(this.model.status()) {
                case this.model.STATUS.STARTED:
                    this.connect();
                    break;
                case this.model.STATUS.ENDED:
                    this.disconnect();
                    break;
            }
            
            this.render();
        },

        onStartClick: function() {
            this.connect();
        },

        onEndClick: function() {
            this.triggerEvent(events.UPDATE_CHAT_STATUS, {
                chat: this.model.chat(),
                status: this.model.STATUS.ENDED
            });
        },
        
        onTwilioCancel: function() {
            console.log('twilio cancel');
        },

        onTwilioConnect: function() {
            if(this.model.status() === this.model.STATUS.PENDING) {
                this.triggerEvent(events.UPDATE_CHAT_STATUS, {
                    chat: this.model.chat(),
                    status: this.model.STATUS.STARTED
                });
            }
            this.triggerEvent(events.UPDATE_CHAT_USER_STATUS, {
                chat: this.model.chat(),
                status: 'CONNECTED'
            });
        },

        onTwilioDisconnect: function() {
            this.triggerEvent(events.UPDATE_CHAT_USER_STATUS, {
                chat: this.model.chat(),
                status: 'DISCONNECTED'
            });
        },

        onTwilioError: function() {
            console.log('twilio error');
        }
    });
    
    /**
     * Chat View
     * @constructor
     * @param {Object} options
     */
    var ChatView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.template = _.template(chat_template);
            this.model = options.model;

            //models
            this.currentUser = null;
            this.chatState = null;
            this.credential = null;
            this.participant = null;
            this.messages = null;
            this.initModels();
            this.running = false;

            //bind events
            this.listenTo(this.messages, 'add', this.onMessage);
            this.listenTo(this.chatState, 'change:status', this.onStatusChange);
            this.withRelated = [
                'chat_participants',
                'topic__tree'
            ];

            //load data
            this.loader = new api.loader.ApiLoader([
                { instance: this.model, withRelated: this.withRelated }
            ]);
            this.loader.load();

            //child views
            this.messageHandlerView = null;
            this.connectionView = null;
            this.participantsView = null;
            this.initChildViews();

            //message
            this.messagePump = new message.ChatMessagePump({
                model: this.model,
                collection: this.messages
            });

            this.start();
        },

        initModels: function() {
            this.currentUser = new api.models.User({
                id: 'CURRENT'
            });
            this.chatState = new models.ChatState({
                chat: this.model
            });
            this.credential = this.chatState.credential();
            this.participant = this.chatState.currentParticipant();
            this.chatState.users().add({
                    userId: this.currentUser.id,
                    status: 'DISCONNECTED',
                    firstName: this.currentUser.get_first_name(),
                    participant: this.participant.get_participant()
            });
            this.messages = new api.models.ChatMessageCollection(null, {
                noSession: true
            });
        },

        initChildViews: function() {
            this.messageHandlerView = new message.ChatMessageHandlerView({
                model: this.chatState

            });
            this.connectionView = new ChatConnectionView({
                model: this.chatState
            });

            this.participantsView = new ui.collection.views.ListView({
                viewFactory: new core.factory.Factory(ChatParticipantView, {}),
                collection: this.chatState.users()
            });
        },

        childViews: function() {
            return [
                this.messageHandlerView,
                this.connectionView,
                this.participantsView
            ];
        },
        
        render: function() {
            this.$el.html(this.template());
            this.append(this.messageHandlerView);
            this.append(this.connectionView, '.connection-container');
            this.append(this.participantsView, '.participants-container');
            return this;
        },

        destroy: function() {
            this.stop();
            ChatView.__super__.destroy.apply(this, arguments);
        },

        start: function() {
            if(this.running) {
                return;
            }

            this.running = true;
            this.messagePump.start();
            
            //Broadcast the current user's status.
            //We need to delay it as second to ensure that
            //our view has been added to the dom so the
            //event propagates properly.
            var broadcast = _.bind(
                    this.messageHandlerView.broadcastUserStatus,
                    this.messageHandlerView);
            setTimeout(broadcast, 1000);
        },

        stop: function() {
            if(!this.running) {
                return;
            }

            this.running = false;
            this.messagePump.stop();
        },

        onMessage: function(message) {
            this.messageHandlerView.handle(message);
        },

        onStatusChange: function() {
            switch(this.chatState.status()) {
                case this.chatState.STATUS.ENDED:
                    this.stop();
                    break;
            }
        }

    });

    return {
        ChatView: ChatView
    };
});
