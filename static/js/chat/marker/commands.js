define([
    'Underscore',
    'core/command',
    'chat/marker/models',
    'chat/marker/proxies',
], function(
    _,
    command,
    marker_models,
    marker_proxies) {
    
    var CreateMarkerCommand = command.AsyncCommand.extend({

        asyncCallbackArgs: ['model', 'response'],

        execute: function(options) {
            var markersProxy = this.facade.getProxy(marker_proxies.ChatMarkersProxy.NAME);

            var marker = new markersProxy.collection.model(options);

            marker.save(null, {
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this),
            });

            return true;
        },

    });

    var CreateConnectedMarkerCommand = command.AsyncCommand.extend({

        asyncCallbackArgs: ['model', 'response'],

        execute: function(options) {
            var markersProxy = this.facade.getProxy(marker_proxies.ChatMarkersProxy.NAME);

            var marker = new marker_models.ConnectedMarker({
                userId: options.userId,
                isConnected: options.isConnected,
            });

            marker.save(null, {
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this),
            });

            return true;
        },

    });

    var CreatePublishingMarkerCommand = command.AsyncCommand.extend({

        asyncCallbackArgs: ['model', 'response'],

        execute: function(options) {
            var markersProxy = this.facade.getProxy(marker_proxies.ChatMarkersProxy.NAME);

            var marker = new marker_models.PublishingMarker({
                userId: options.userId,
                isPublishing: options.isPublishing,
            });

            marker.save(null, {
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this),
            });

            return true;
        },

    });

    var CreateSpeakingMarkerCommand = command.AsyncCommand.extend({

        asyncCallbackArgs: ['model', 'response'],

        execute: function(options) {
            var markersProxy = this.facade.getProxy(marker_proxies.ChatMarkersProxy.NAME);

            var marker = new marker_models.SpeakingMarker({
                userId: options.userId,
                isSpeaking: options.isSpeaking,
            });

            marker.save(null, {
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this),
            });

            return true;
        },

    });

    return {
        CreateMarkerCommand: CreateMarkerCommand,
        CreateConnectedMarkerCommand: CreateConnectedMarkerCommand,
        CreatePublishingMarkerCommand: CreatePublishingMarkerCommand,
        CreateSpeakingMarkerCommand: CreateSpeakingMarkerCommand,
    };
});
