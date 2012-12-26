define([
    'jquery',
    'underscore',
    'backbone',
    'backbone.localStorage'
], function(
    $,
    _,
    Backbone,
    none) {
    
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
     * Chat Started Marker.
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var StartedMarker = Marker.extend({

        defaults: function() {
            return {
                markerId: null,
                type: StartedMarker.TYPE,
                userId: null
            };
        },

        initialize: function(attributes, options) {
        }

    }, {
        TYPE: 'STARTED_MARKER'
    });

    /**
     * Chat Ended Marker.
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var EndedMarker = Marker.extend({

        defaults: function() {
            return {
                markerId: null,
                type: EndedMarker.TYPE,
                userId: null
            };
        },

        initialize: function(attributes, options) {
        }

    }, {
        TYPE: 'ENDED_MARKER'
    });

    /**
     * Chat Recording Started Marker.
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var RecordingStartedMarker = Marker.extend({

        defaults: function() {
            return {
                markerId: null,
                type: RecordingStartedMarker.TYPE,
                userId: null,
                archiveId: null
            };
        },

        initialize: function(attributes, options) {
        }

    }, {
        TYPE: 'RECORDING_STARTED_MARKER'
    });

    /**
     * Chat Ended Marker.
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var RecordingEndedMarker = Marker.extend({

        defaults: function() {
            return {
                markerId: null,
                type: RecordingEndedMarker.TYPE,
                userId: null,
                archiveId: null
            };
        },

        initialize: function(attributes, options) {
        }

    }, {
        TYPE: 'RECORDING_ENDED_MARKER'
    });

    /**
     * Chat Skew Marker.
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var SkewMarker = Marker.extend({

        defaults: function() {
            return {
                markerId: null,
                type: SkewMarker.TYPE,
                userId: null,
                userTimestamp: null,
                systemTimestamp: null,
                skew: null
            };
        },

        initialize: function(attributes, options) {
        }

    }, {
        TYPE: 'SKEW_MARKER'
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
                case StartedMarker.TYPE: 
                    result = new StartedMarker(attributes, options);
                    break;
                case EndedMarker.TYPE: 
                    result = new EndedMarker(attributes, options);
                    break;
                case RecordingStartedMarker.TYPE: 
                    result = new RecordingStartedMarker(attributes, options);
                    break;
                case RecordingEndedMarker.TYPE: 
                    result = new RecordingEndedMarker(attributes, options);
                    break;
                case SkewMarker.TYPE:
                    result = new SkewMarker(attributes, options);
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
        SpeakingMarker: SpeakingMarker,
        StartedMarker: StartedMarker,
        EndedMarker: EndedMarker,
        RecordingStartedMarker: RecordingStartedMarker,
        RecordingEndedMarker: RecordingEndedMarker,
        SkewMarker: SkewMarker
    };
});
