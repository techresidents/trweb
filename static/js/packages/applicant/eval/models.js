define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api'
], function($, _, Backbone, core, api) {
    
    /**
     * Eval Model
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var Eval = Backbone.Model.extend({

        defaults: {
            name: null,
            technicalScore: 0,
            communicationScore: 0,
            culturalFitScore: 0,
            vote: null
        },

        name: function() {
            return this.get('name');
        },

        setName: function(value) {
            this.set('name', value);
            return this;
        },

        technicalScore: function() {
            return this.get('technicalScore');
        },

        setTechnicalScore: function(value) {
            this.set('technicalScore', value);
            return this;
        },

        communicationScore: function() {
            return this.get('communicationScore');
        },

        setCommunicationScore: function(value) {
            this.set('communicationScore', value);
            return this;
        },

        culturalFitScore: function() {
            return this.get('culturalFitScore');
        },

        setCulturalFitScore: function(value) {
            this.set('culturalFitScore', value);
            return this;
        },

        vote: function() {
            return this.get('vote');
        },

        setVote: function(value) {
            this.set('vote', value);
            return this;
        },

        averageScore: function() {
            var avg = 0;
            var scores = [];
            var dimensions = [
                'technicalScore',
                'communicationScore',
                'culturalFitScore'
            ];

            _.each(dimensions, function(d) {
                var score = this.get(d);
                if(score) {
                    scores.push(score);
                }
            }, this);

            return core.array.average(scores);
        }
    });

    /**
     * EvalCollection
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var EvalCollection = Backbone.Collection.extend({

        model: Eval,

        fromApplication: function(application) {
            var scores = application.get_application_scores().clone();
            var votes = application.get_application_votes().clone();
            var scoresQuery = scores.query();
            var votesQuery = votes.query();
            var userCollection = new api.models.UserCollection();
            var currentUser = new api.models.User({id: 'CURRENT'});

            var query = userCollection
                .chain([votesQuery, scoresQuery], function(votes, scores) {
                    var userIds = [currentUser.id];
                    userIds = userIds.concat(scores.pluck('user_id'));
                    userIds = userIds.concat(votes.pluck('user_id'));
                    userIds = _.uniq(userIds);
                    this.filterBy({'id__in': userIds.join(',')});
            });

            var map = function(user) {
                var result = {};
                var vote = _.first(votes.where({user_id: user.id}));
                var score = _.first(scores.where({user_id: user.id}));
                var name = user.get_first_name() + ' ' + user.get_last_name();

                result.name = name;
                if(vote) {
                    result.vote = vote.get_yes();
                }
                if(score) {
                    result.technicalScore = score.get_technical_score();
                    result.communicationScore = score.get_communication_score();
                    result.culturalFitScore = score.get_cultural_fit_score();
                }
                return result;
            };

            query.fetch({
                success: _.bind(function() {
                    this.reset(userCollection.map(map));
                }, this)
            });

            return this;
        }
    });

    return {
        Eval: Eval,
        EvalCollection: EvalCollection
    };
});
