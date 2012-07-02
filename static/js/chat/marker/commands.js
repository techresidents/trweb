define([
    'Underscore',
    'core/command',
    'chat/marker/models',
    'chat/message/messages',
    'chat/message/models',
], function(
    _,
    command,
    marker_models,
    messages,
    message_models) {

    /**
     * Create Marker Command
     * @constructor
     *
     * Creates a chat marker by creating and sending ChatMessage
     * with MarkerCreateMessage body.
     */
    var CreateMarkerCommand = command.AsyncCommand.extend({
        
        //argument names for onSuccess and onError paramaters
        asyncCallbackArgs: ['model', 'response'],

        execute: function(options) {

            var message = new message_models.ChatMessage({
                header: new messages.MessageHeader(),
                msg: new messages.MarkerCreateMessage({
                    marker: options,
                }),
            });
            
            //send message
            message.save(null, {
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this),
            });

            return true;
        },

    });


    /**
     * Create Joined Marker Command
     * @constructor
     *
     * Creates a chat joined marker by creating and sending ChatMessage
     * with MarkerCreateMessage body.
     */
    var CreateJoinedMarkerCommand = command.AsyncCommand.extend({

        //argument names for onSuccess and onError paramaters
        asyncCallbackArgs: ['model', 'response'],
        
        /**
         * Execute command
         * @param {Object} options
         *   {integer} userId 
         *   {boolean} isConnected
         *   {function} onSuccess optional success callback
         *   {function} onError optional error callback
         *   {Object} context optional callback context
         */
        execute: function(options) {
            var message = new message_models.ChatMessage({
                header: new messages.MessageHeader(),
                msg: new messages.MarkerCreateMessage({
                    marker: {
                        type: marker_models.JoinedMarker.TYPE,
                        userId: options.userId,
                        name: options.name,
                    }
                }),
            });
            
            //send message
            message.save(null, {
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this),
            });

            return true;
        },

    });

    /**
     * Create Connected Marker Command
     * @constructor
     *
     * Creates a chat connected marker by creating and sending ChatMessage
     * with MarkerCreateMessage body.
     */
    var CreateConnectedMarkerCommand = command.AsyncCommand.extend({

        //argument names for onSuccess and onError paramaters
        asyncCallbackArgs: ['model', 'response'],
        
        /**
         * Execute command
         * @param {Object} options
         *   {integer} userId 
         *   {boolean} isConnected
         *   {function} onSuccess optional success callback
         *   {function} onError optional error callback
         *   {Object} context optional callback context
         */
        execute: function(options) {
            var message = new message_models.ChatMessage({
                header: new messages.MessageHeader(),
                msg: new messages.MarkerCreateMessage({
                    marker: {
                        type: marker_models.ConnectedMarker.TYPE,
                        userId: options.userId,
                        isConnected: options.isConnected,
                    }
                }),
            });
            
            //send message
            message.save(null, {
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this),
            });

            return true;
        },

    });


    /**
     * Create Publishing Marker Command
     * @constructor
     *
     * Creates a chat publishing marker by creating and sending ChatMessage
     * with MarkerCreateMessage body.
     */
    var CreatePublishingMarkerCommand = command.AsyncCommand.extend({

        //argument names for onSuccess and onError paramaters
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute command
         * @param {Object} options
         *   {integer} userId 
         *   {boolean} isPublishing
         *   {function} onSuccess optional success callback
         *   {function} onError optional error callback
         *   {Object} context optional callback context
         */
        execute: function(options) {
            var message = new message_models.ChatMessage({
                header: new messages.MessageHeader(),
                msg: new messages.MarkerCreateMessage({
                    marker: {
                        type: marker_models.PublishingMarker.TYPE,
                        userId: options.userId,
                        isPublishing: options.isPublishing,
                    }
                }),
            });

            //send message
            message.save(null, {
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this),
            });

            return true;
        },

    });


    /**
     * Create Speaking Marker Command
     * @constructor
     *
     * Creates a chat speaking marker by creating and sending ChatMessage
     * with MarkerCreateMessage body.
     */
    var CreateSpeakingMarkerCommand = command.AsyncCommand.extend({

        //argument names for onSuccess and onError paramaters
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute command
         * @param {Object} options
         *   {integer} userId 
         *   {boolean} isSpeaking
         *   {function} onSuccess optional success callback
         *   {function} onError optional error callback
         *   {Object} context optional callback context
         */
        execute: function(options) {
            var message = new message_models.ChatMessage({
                header: new messages.MessageHeader(),
                msg: new messages.MarkerCreateMessage({
                    marker: {
                        type: marker_models.SpeakingMarker.TYPE,
                        userId: options.userId,
                        isSpeaking: options.isSpeaking,
                    }
                }),
            });

            message.save(null, {
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this),
            });
        },

    });

    return {
        CreateMarkerCommand: CreateMarkerCommand,
        CreateConnectedMarkerCommand: CreateConnectedMarkerCommand,
        CreateJoinedMarkerCommand: CreateJoinedMarkerCommand,
        CreatePublishingMarkerCommand: CreatePublishingMarkerCommand,
        CreateSpeakingMarkerCommand: CreateSpeakingMarkerCommand,
    };
});
