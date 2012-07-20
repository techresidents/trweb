define([
    'jQuery',
    'Underscore',
    'Backbone'
], function(
    $,
    _,
    Backbone) {
    
    /**
     * Chat Marker base model.
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var Marker = Backbone.Model.extend({

        idAttribute: 'markerId',

        localStorage: new Backbone.LocalStorage('Marker'),

        defaults: function() {
            return {
                markerId: null,
                marker: null
            };
        },
        
        initialize: function(attributes, options) {
        },

        marker: function() {
            return this.get('marker');
        },

        setMarker: function(marker) {
            this.set({marker: marker});
            return this;
        },
        
        /**
         * Convert markers to JSON.
         * This method should be compatible with all subclasses.
         * @return {Object} - JSON representation.
         */
        toJSON: function() {
            var result = {
                markerId: this.attributes.markerId,
                marker: {}
            };
            var key;

            for(key in this.defaults()) {
                if(key !== 'markerId') {
                    result.marker[key] = this.attributes[key];
                }
            }

            return result;
        }

    });


    /**
     * Chat Joined Marker.
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var JoinedMarker = Marker.extend({

        defaults: function() {
            return {
                markerId: null,
                type: JoinedMarker.TYPE,
                userId: null,
                name: null
            };
        },

        initialize: function(attributes, options) {
        }

    }, {
        TYPE: 'JOINED_MARKER'
    });


    /**
     * Chat Connected Marker.
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var ConnectedMarker = Marker.extend({

        defaults: function() {
            return {
                markerId: null,
                type: ConnectedMarker.TYPE,
                userId: null,
                isConnected: null
            };
        },

        initialize: function(attributes, options) {
        }

    }, {
        TYPE: 'CONNECTED_MARKER'
    });


    /**
     * Chat Publishing Marker.
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var PublishingMarker = Marker.extend({

        defaults: function() {
            return {
                markerId: null,
                type: PublishingMarker.TYPE,
                userId: null,
                isPublishing: null
            };
        },

        initialize: function(attributes, options) {
        }

    }, {
        TYPE: 'PUBLISHING_MARKER'
    });


    /**
     * Chat Speaking Marker.
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var SpeakingMarker = Marker.extend({

        defaults: function() {
            return {
                markerId: null,
                type: SpeakingMarker.TYPE,
                userId: null,
                isSpeaking: null
            };
        },

        initialize: function(attributes, options) {
        }

    }, {
        TYPE: 'SPEAKING_MARKER'
    });


    /**
     * Chat Marker collection.
     * @constructor
     */
    var MarkerCollection = Backbone.Collection.extend({

        /**
         * Create concrete Marker based on options.type.
         * @param {Object} attributes
         * @param {Object} options
         *   type Marker type (required)
         * @return {Marker} subclass.
         */
        model: function(attributes, options) {
            var result;
            switch(options.type) {
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

        localStorage: new Backbone.LocalStorage('MarkerCollection')
    });

    return {
        Marker: Marker,
        MarkerCollection: MarkerCollection,
        ConnectedMarker: ConnectedMarker,
        JoinedMarker: JoinedMarker,
        PublishingMarker: PublishingMarker,
        SpeakingMarker: SpeakingMarker
    };
});
