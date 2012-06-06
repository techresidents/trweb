define([
    'jQuery',
    'Underscore',
    'Backbone',
    'xd/backbone',
    'chat/message/messages',
    'chat/message/models',
], function(
    $,
    _,
    Backbone,
    xdBackbone,
    messages,
    message_models) {
    
    /**
     * Chat Marker model.
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var Marker = message_models.ChatMessageBaseModel.extend({
            
        idAttribute: 'markerId',

        message: messages.MarkerCreateMessage,

        defaults: function() {
            return {
                markerId: null,
                marker: null,
            };
        },
        
        initialize: function(attributes, options) {
            this.reinitialize(attributes, options);
        },

        marker: function() {
            return this.get('marker');
        },

        setMarker: function(marker) {
            this.set({marker: marker});
            return this;
        },

        toJSON: function() {
            var result = {
                markerId: this.attributes.markerId,
                marker: {},
            };

            for(var key in this.defaults()) {
                if(key !== 'markerId') {
                    result.marker[key] = this.attributes[key];
                }
            }

            return result;
        },

    });


    var ConnectedMarker = Marker.extend({

        defaults: function() {
            return {
                markerId: null,
                type: ConnectedMarker.TYPE,
                userId: null,
                isConnected: null,
            };
        },

        initialize: function(attributes, options) {
            this.reinitialize(attributes, options);
        },

    }, {
        TYPE: 'CONNECTED_MARKER',
    });


    var PublishingMarker = Marker.extend({

        defaults: function() {
            return {
                markerId: null,
                type: PublishingMarker.TYPE,
                userId: null,
                isPublishing: null,
            };
        },

        initialize: function(attributes, options) {
            this.reinitialize(attributes, options);
        },

    }, {
        TYPE: 'PUBLISHING_MARKER',
    });


    var SpeakingMarker = Marker.extend({

        defaults: function() {
            return {
                markerId: null,
                type: SpeakingMarker.TYPE,
                userId: null,
                isSpeaking: null,
            };
        },

        initialize: function(attributes, options) {
            this.reinitialize(attributes, options);
        },

    }, {
        TYPE: 'SPEAKING_MARKER',
    });


    /**
     * Chat Marker collection.
     */
    var MarkerCollection = Backbone.Collection.extend({

        model: function(attributes, options) {
            var type;
            var result;

            if(attributes && attributes.type) {
                type = attributes.type;
            } else if(options && options.msg && options.msg.marker) {
                type = options.msg.marker.type;
            }

            switch(type) {
                case ConnectedMarker.TYPE: 
                    result = new ConnectedMarker(attributes, options);
                    break;
                case PublishingMarker.TYPE: 
                    result = new PublishingMarker(attributes, options);
                    break;
                case SpeakingMarker.TYPE: 
                    result = new SpeakingMarker(attributes, options);
                    break;
                default:
                    result = new Marker(attributes, options);
                    break;
            }

            return result;
        },
        
        /**
         * Cross domain compatible sync.
         */
        sync: xdBackbone.sync,
    });

    return {
        Marker: Marker,
        MarkerCollection: MarkerCollection,
        ConnectedMarker: ConnectedMarker,
        PublishingMarker: PublishingMarker,
        SpeakingMarker: SpeakingMarker,
    };
});
