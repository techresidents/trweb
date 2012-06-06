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
    
    var CreateMarkerCommand = command.AsyncCommand.extend({

        asyncCallbackArgs: ['model', 'response'],

        execute: function(options) {

            var message = new message_models.ChatMessage({
                header: new messages.MessageHeader(),
                msg: new messages.MarkerCreateMessage({
                    marker: options,
                }),
            });

            message.save(null, {
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this),
            });

            return true;
        },

    });

    var CreateConnectedMarkerCommand = command.AsyncCommand.extend({

        asyncCallbackArgs: ['model', 'response'],

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

            message.save(null, {
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this),
            });

            return true;
        },

    });

    var CreatePublishingMarkerCommand = command.AsyncCommand.extend({

        asyncCallbackArgs: ['model', 'response'],

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

            message.save(null, {
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this),
            });

            return true;
        },

    });

    var CreateSpeakingMarkerCommand = command.AsyncCommand.extend({

        asyncCallbackArgs: ['model', 'response'],

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
        CreatePublishingMarkerCommand: CreatePublishingMarkerCommand,
        CreateSpeakingMarkerCommand: CreateSpeakingMarkerCommand,
    };
});
