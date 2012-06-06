define([
    'jQuery',
    'Underscore',
    'Backbone',
    'xd/xd',
    'xd/backbone',
    'chat/message/messages',
    'chat/user/models',
], function($, _, Backbone, xd, xdBackbone, messages, user) {
    
    /**
     * Chat Marker model.
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var Marker = Backbone.Model.extend({
            
        idAttribute: 'markerId',

        defaults: function() {
            return {
                markerId: null,
                marker: null,
            };
        },
        
        initialize: function(attributes, options) {
            this.reinitialize(attributes, options);
        },

        reinitialize: function(attributes, options) {
            var optionsProvided = false;

            if(options && options.header && options.msg) {
                this.header = options.header;
                this.msg = options.msg;
                optionsProvided = true;
            } else {
                this.header = new messages.MessageHeader;
                this.msg = new messages.MarkerCreateMessage;
            }

            if(optionsProvided) {
                this.set({
                    markerId: this.msg.markerId,
                    marker: this.msg.marker,
                });
            }
        },

        marker: function() {
            return this.get('marker');
        },

        setMarker: function(marker) {
            this.set({marker: marker});
            return this;
        },

        urlRoot: function() {
            return this.header.url() + this.msg.url();
        },

        /**
         * Cross domain compatible sync.
         */
       sync: xdBackbone.sync,

        parse: function(response) {
            this.header = new messages.MessageHeader(response.header);
            this.msg = new messages.MarkerCreateMessage(response.msg);

            return {
                markerId: response.msg.markerId,
                marker: response.msg.marker,
            };
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

        reinitialize: function(attributes, options) {
            var optionsProvided = false;

            if(options && options.header && options.msg) {
                this.header = options.header;
                this.msg = options.msg;
                optionsProvided = true;
            } else {
                this.header = new messages.MessageHeader;
                this.msg = new messages.MarkerCreateMessage;
            }

            if(optionsProvided) {
                this.set({
                    markerId: this.msg.markerId,
                    userId: this.msg.marker.userId,
                    isConnected: this.msg.marker.isConnected,
                });
            }
        },

        toJSON: function() {
            return {
                markerId: this.attributes.markerId,
                marker: {
                    type: this.attributes.type,
                    userId: this.attributes.userId,
                    isConnected: this.attributes.isConnected,
                }
            };
        },
        
        parse: function(response) {
            this.header = new messages.MessageHeader(response.header);
            this.msg = new messages.MarkerCreateMessage(response.msg);

            return {
                markerId: response.msg.markerId,
                userId: response.msg.marker.userId,
                isConnected: response.msg.marker.isConnected,
            };
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

        reinitialize: function(attributes, options) {
            var optionsProvided = false;

            if(options && options.header && options.msg) {
                this.header = options.header;
                this.msg = options.msg;
                optionsProvided = true;
            } else {
                this.header = new messages.MessageHeader;
                this.msg = new messages.MarkerCreateMessage;
            }

            if(optionsProvided) {
                this.set({
                    markerId: this.msg.markerId,
                    userId: this.msg.marker.userId,
                    isPublishing: this.msg.marker.isPublishing,
                });
            }
        },

        toJSON: function() {
            return {
                markerId: this.attributes.markerId,
                marker: {
                    type: this.attributes.type,
                    userId: this.attributes.userId,
                    isPublishing: this.attributes.isPublishing,
                }
            };
        },
        
        parse: function(response) {
            this.header = new messages.MessageHeader(response.header);
            this.msg = new messages.MarkerCreateMessage(response.msg);

            return {
                markerId: response.msg.markerId,
                userId: response.msg.marker.userId,
                isPublishing: response.msg.marker.isPublishing,
            };
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

        reinitialize: function(attributes, options) {
            var optionsProvided = false;

            if(options && options.header && options.msg) {
                this.header = options.header;
                this.msg = options.msg;
                optionsProvided = true;
            } else {
                this.header = new messages.MessageHeader;
                this.msg = new messages.MarkerCreateMessage;
            }

            if(optionsProvided) {
                this.set({
                    markerId: this.msg.markerId,
                    userId: this.msg.marker.userId,
                    isSpeaking: this.msg.marker.isSpeaking,
                });
            }
        },

        toJSON: function() {
            return {
                markerId: this.attributes.markerId,
                marker: {
                    type: this.attributes.type,
                    userId: this.attributes.userId,
                    isSpeaking: this.attributes.isSpeaking,
                }
            };
        },
        
        parse: function(response) {
            this.header = new messages.MessageHeader(response.header);
            this.msg = new messages.MarkerCreateMessage(response.msg);

            return {
                markerId: response.msg.markerId,
                userId: response.msg.marker.userId,
                isSpeaking: response.msg.marker.isSpeaking,
            };
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
