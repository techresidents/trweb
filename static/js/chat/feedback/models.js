define([
    'jQuery',
    'Underscore',
    'Backbone'
], function($, _, Backbone) {
   
    var QUALITY = {
        EXCELLENT: 'Excellent',
        GOOD: 'Good',
        AVERAGE: 'Average',
        FAIR: 'Fair',
        POOR: 'Poor'
    };

    /**
     * Feedback Model
     * @constructor
     * @param {Object} attributes
     */
    var Feedback = Backbone.Model.extend({
        
        localStorage: new Backbone.LocalStorage('FeedbackModel'),
        
        defaults: function() {
            return {
                chatSessionId: null,
                overallQuality: null,
                technicalQuality: null
            };
        },
        
        initialize: function(attributes, options) {
        },

        validate: function(attributes) {
            var result = {
                status: true,
                errors: {},
                valids: {}
            };
            
            var keys = ['overallQuality', 'technicalQuality'];
            keys.map(function(key) {
                if(attributes[key]) {
                    if(QUALITY.hasOwnProperty(attributes[key])) {
                        result.valids[key] = attributes[key];
                    } else {
                        result.errors[key] = 'Invalid value';
                        result.status = false;
                    }
                } else {
                    result.errors[key] = 'Field required';
                    result.status = false;
                }

            });
            
            return result;
        },

        chatSessionId: function() {
            return this.get('chatSessionId');
        },

        setChatSessionId: function(chatSessionId) {
            this.set({chatSessionId: chatSessionId});
            return this;
        },

        overallQuality: function() {
            return this.get('overallQuality');
        },

        setOverallQuality: function(quality) {
            this.set({overallQuality: quality});
            return this;
        },

        technicalQuality: function() {
            return this.get('technicalQuality');
        },

        setTechnicalQuality: function(quality) {
            this.set({technicalQuality: quality});
            return this;
        }
       
    });

    return {
        Feedback: Feedback
    };
});
