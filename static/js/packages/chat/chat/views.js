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
    '../tlkpt/views',
    '../topicpt/views',
    'text!./templates/chat.html',
    'text!./templates/connection.html',
    'text!./templates/end.html',
    'text!./templates/error.html',
    'text!./templates/instructions.html',
    'text!./templates/participant.html',
    'text!./templates/participants.html',
    'text!./templates/timer.html'
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
    tlkpt_views,
    topicpt_views,
    chat_template,
    connection_template,
    end_template,
    error_template,
    instructions_template,
    participant_template,
    participants_template,
    timer_template) {

    /**
     * Chat End View
     * @constructor
     * @param {Object} options
     * @param {ChatState} options.model ChatState model
     * @classdesc
     * End of chat modal view.
     */
    var ChatEndView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.model = options.model;
            this.template = _.template(end_template);
            this.action = 'Exit Chat';
        },

        render: function() {
            this.$el.html(this.template());
            return this;
        },

        onAction: function() {
            var addToReel = this.$('.reel-checkbox').is(':checked');
            if(addToReel) {
                this.triggerEvent(events.ADD_CHAT_TO_REEL, {
                    chat: this.model.chat()
                });
            }

            this.triggerEvent(events.VIEW_NAVIGATE, {
                type: 'DeveloperHomeView'
            });
            return true;
        }
    });

    /**
     * Chat Topic Points View
     * @constructor
     * @param {Object} options
     * @param {ChatState} options.model ChatState model
     */
    var ChatTopicPointsView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.model = options.model;
            this.topicTree = this.model.chat().get_topic().get_tree();

            //child views
            this.topicPointsView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            var talkingPointsViewFactory = new core.factory.Factory(
                tlkpt_views.TalkingPointStrikeCollectionView, {});

            this.topicPointsView = new ui.collection.views.ListView({
                collection: this.topicTree,
                viewFactory: new core.factory.Factory(
                    topicpt_views.TopicPointView, {
                        talkingPointsViewFactory: talkingPointsViewFactory
                    })
            });
        },

        childViews: function() {
            return [this.topicPointsView];
        },

        classes: function() {
            return ['chat-topic-points'];
        },

        render: function() {
            this.$el.html();
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.topicPointsView);
            return this;
        }
    });

    /**
     * Chat Timer View
     * @constructor
     * @param {Object} options
     * @param {ChatState} options.model ChatState model
     */
    var ChatTimerView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.model = options.model;
            this.template = _.template(timer_template);

            //bind events
            this.listenTo(this.model, 'change:status', this.onStatusChange);

            //child views
            this.timerView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            var duration = this.model.chat().get_max_duration() * 1000;
            this.timerView = new ui.timer.views.DurationTimerView({
                duration: duration
            });
        },

        childViews: function() {
            return [this.timerView];
        },

        classes: function() {
            return ['chat-timer'];
        },

        render: function() {
            var context = this.model.toJSON();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.timerView);
            return this;
        },

        onStatusChange: function() {
            switch(this.model.status()) {
                case this.model.STATUS.STARTED:
                    this.timerView.start(this.model.startTime());
                    break;
                case this.model.STATUS.ENDED:
                    this.timerView.stop();
                    break;
            }
        }
    });

    /**
     * Chat Participant View
     * @constructor
     * @param {Object} options
     * @param {ChatState} options.model ChatState model
     * @classdesc
     * View of an individual chat participant and their status.
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
     * Chat Participants View
     * @constructor
     * @param {Object} options
     * @param {ChatState} options.model ChatState model
     * @classdesc
     * View of all participants in the chat.
     */
    var ChatParticipantsView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.model = options.model;
            this.template = _.template(participants_template);

            //child views
            this.listView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.listView = new ui.collection.views.ListView({
                viewFactory: new core.factory.Factory(ChatParticipantView, {}),
                collection: this.model.users()
            });
        },

        childViews: function() {
            return [this.listView];
        },

        classes: function() {
            return ['chat-participants'];
        },

        render: function() {
            this.$el.html(this.template());
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.listView);
            return this;
        }
    });

    /**
     * Chat Connection View
     * @constructor
     * @param {Object} options
     * @param {ChatState} options.model ChatState model
     * @classdesc
     * Chat connection view is repsonible for starting and stopping
     * the chat and establishing the necessary Twilio connection.
     * Note that in the case of a simulated chat a connection
     * to Twilio will NOT be established.
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
            this.listenTo(this.model.users(), 'add remove change:status', this.onUserChange);

            this.setup();
        },

        isSimulation: function() {
            return this.model.simulation();
        },

        render: function() {
            var context = this.model.toJSON();
            context.canStartChat = this._canStartChat();
            this.$el.html(this.template(context));
            return this;
        },

        setup: function() {

            //Setup Twilio device singleton
            Twilio.Device.setup(this.credential.get_twilio_capability(), {
                debug: true
            });
            
            //bind Twilio device events
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
            // if it's a simulation bypass connection
            if(this.isSimulation()) {
                this.onTwilioConnect();
                return;
            }

            if(!this.twilioConnection ||
               this.twilioConnection.status() === 'closed') {
                this.twilioConnection = Twilio.Device.connect({
                    user_id: this.currentUser.id,
                    chat_token: this.credential.get_token()
                });
            }
        },

        disconnect: function() {
            // if it's a simulation bypass disconnect
            if(this.isSimulation()) {
                this.onTwilioDisconnect();
                return;
            }

            Twilio.Device.disconnectAll();
            
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

        onUserChange: function() {
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
            //TODO
            console.log('twilio cancel');
        },

        onTwilioConnect: function() {
            //We wait until we're connected to Twilio before we
            //start the chat and the timer. This is important since
            //the connection process for Twilio can take some time
            //since the user needs to grant flash access to their
            //micropohone.
            if(this.model.status() === this.model.STATUS.PENDING) {
                this.triggerEvent(events.UPDATE_CHAT_STATUS, {
                    chat: this.model.chat(),
                    status: this.model.STATUS.STARTED
                });
            }

            //Update user's status
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
            //TODO
            console.log('twilio error');
        },

        _canStartChat: function() {
            var result = true;

            //Don't allow multiple participant chats to be started
            //until at least two particpants have arrived.
            if(this.model.chat().get_max_participants() > 1 &&
               this.model.availableUsers().length <= 1) {
                   result = false;
            }
            return result;
        }
    });

    /**
     * Chat Instructions View
     * @constructor
     * @param {Object} options
     * @param {ChatState} options.model ChatState model
     * @classdesc
     * The chat instructions view displays instructions to the user
     * prior to the start of the chat.
     */
    var ChatInstructionsView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.model = options.model;
            this.template = _.template(instructions_template);

            //bind events
            this.listenTo(this.model, 'change:status', this.render);
            this.listenTo(this.model.users(), 'add remove change:status', this.render);
        },

        classes: function() {
            return ['chat-instructions'];
        },

        render: function() {
            var context = this.model.toJSON();
            context.availableUsers = this.model.availableUsers();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        }
    });
    
    /**
     * Chat View
     * @constructor
     * @param {Object} options
     * @param {Chat} options.model Chat model which must be loaded
     *   along with the ChatParticipant and ChatCredential
     *   for the current user.
     * @param {boolean} options.simulation Boolean indicating if the
     *   chat is a simulation or not. If it's a simulation we won't
     *   really connect to Twilio and incur charges. This is useful
     *   for development purposes.
     */
    var ChatView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.template = _.template(chat_template);
            this.model = options.model;
            this.simulation = options.simulation;

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
            this.timerView = null;
            this.endView = null;
            this.instructionsView = null;
            this.topicPointsView = null;
            this.initChildViews();

            //Message pump which will long poll for new chat messages
            //and add them to the message collection as they arrive.
            //When new messages arrive in the collection we'll pass
            //them to message handler view for proper processing.
            this.messagePump = new message.ChatMessagePump({
                model: this.model,
                collection: this.messages
            });

            //start the chat
            this.start();
        },

        initModels: function() {
            this.currentUser = new api.models.User({
                id: 'CURRENT'
            });

            //create ChatState model which will be passed to
            //all child views. ChatState model will be updated
            //to reflect the current state of the chat as new
            //messages are received.
            this.chatState = new models.ChatState({
                chat: this.model,
                simulation: this.simulation
            });

            //credential containing the tokens required to participate
            //in the chat
            this.credential = this.chatState.credential();

            //ChatParticipant model for the current user
            this.participant = this.chatState.currentParticipant();

            //Add a UserState model for the current user to the
            //ChatState model. Other users will be added as
            //the arrive to the chat.
            this.chatState.users().add({
                    userId: this.currentUser.id,
                    status: 'DISCONNECTED',
                    firstName: this.currentUser.get_first_name(),
                    participant: this.participant.get_participant()
            });

            //Chat message collection which the message pump will 
            //append new messages to.
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
            this.participantsView = new ChatParticipantsView({
                model: this.chatState
            });
            this.timerView = new ChatTimerView({
                model: this.chatState
            });
            this.topicPointsView = new ChatTopicPointsView({
                model: this.chatState
            });
            this.instructionsView = new ChatInstructionsView({
                model: this.chatState
            });
        },

        childViews: function() {
            return [
                this.messageHandlerView,
                this.connectionView,
                this.participantsView,
                this.timerView,
                this.topicPointsView,
                this.instructionsView,
                this.endView
            ];
        },

        classes: function() {
            return ['chat'];
        },
        
        render: function() {
            this.$el.html(this.template());
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.messageHandlerView);
            this.append(this.connectionView, '.chat-connection-container');
            this.append(this.timerView, '.chat-timer-container');
            this.append(this.participantsView, '.chat-participants-container');
            this.append(this.instructionsView, '.chat-instructions-container');
            this.append(this.topicPointsView, '.chat-topic-points-container');
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

            this.endView = new ui.modal.views.ModalView({
                title: 'Your Chat Has Ended',
                viewOrFactory: new ChatEndView({
                    model: this.chatState
                }),
                exitOnEscape: false,
                exitOnBackdropClick: false
            });
            this.append(this.endView);
        },

        onMessage: function(message) {
            //pass new messages to the message handler for processing.
            //The message handler may send additional chat messages
            //and update the ChatState model which child views
            //are listening to.
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

    /**
     * Chat Error View
     * @constructor
     * @param {Object} options
     * @param {Chat} options.model Chat model
     * @param {string} options.fault Fault message
     *   indicating why user cannot participate in
     *   chat.
     * @classdesc
     * Chat error view is displayed when a user attempts to
     * join a chat which does not exist or is no longer
     * available.
     */
    var ChatErrorView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.model = options.model;
            this.fault = options.fault;
            this.template = _.template(error_template);
        },

        classes: function() {
            return ['chat-error'];
        },

        render: function() {
            var context = {
                fault: this.fault
            };
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        }
    });

    return {
        ChatView: ChatView,
        ChatErrorView: ChatErrorView
    };
});
