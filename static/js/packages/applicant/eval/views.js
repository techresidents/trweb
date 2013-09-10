define([
    'jquery',
    'underscore',
    'core',
    'api',
    'ui',
    './models',
    'text!./templates/team_eval.html',
    'text!./templates/eval_grid_vote.html'
], function(
    $,
    _,
    core,
    api,
    ui,
    eval_models,
    team_eval_template,
    eval_grid_vote_template) {


    var EvalGridVoteView = core.view.View.extend({
        /**
         * @constructs
         * @param {object} options Options object
         * @param {Eval} options.model Eval model
         */
        initialize: function(options) {
            this.model = options.model;
            this.template = _.template(eval_grid_vote_template);
        },

        render: function() {
            var context = {
                model: this.model.toJSON()
            };
            this.$el.html(this.template(context));
            return this;
        }
    });

    var EvalGridView = ui.grid.views.GridView.extend({


        /**
         * @constructs
         * @param {object} options Options object
         * @param {EvalCollection} options.collection Eval collection
         */
        initialize: function(options) {
            var config = {
                columns: [
                    EvalGridView.userColumn(),
                    EvalGridView.technicalColumn(),
                    EvalGridView.communicationColumn(),
                    EvalGridView.culturalFitColumn(),
                    EvalGridView.averageColumn(),
                    EvalGridView.voteColumn()
                ]
            };

            options = _.extend({
                config: config,
                query: new api.query.ApiQuery()
            }, options);

            ui.grid.views.GridView.prototype.initialize.call(this, options);
        },

        classes: function() {
            var result = ui.grid.views.GridView.prototype.classes.call(this);
            result = result.concat(['eval-grid']);
            return result;
        }
    }, {
        userColumn: function() {
            return   {
                column: 'User',
                cellView: new ui.grid.views.GridCellView.Factory(function(options) {
                    return {
                        value: options.model.name()
                    };
                })
            };
        },

        technicalColumn: function() {
            var viewFactory = new core.factory.Factory(ui.rating.stars.views.RatingStarsView,
                function(options) {
                    return {
                        model: options.model,
                        attribute: 'technicalScore',
                        readonly: true,
                        starImageClass: 'rating-star-image-white'
                    };
            });

            return {
                column: 'Technical',
                cellView: new ui.grid.views.GridFactoryCellView.Factory({
                    viewFactory: viewFactory
                })
            };
        },

        communicationColumn: function() {
            var viewFactory = new core.factory.Factory(ui.rating.stars.views.RatingStarsView,
                function(options) {
                    return {
                        model: options.model,
                        attribute: 'communicationScore',
                        readonly: true,
                        starImageClass: 'rating-star-image-white'
                    };
            });

            return {
                column: 'Communication',
                cellView: new ui.grid.views.GridFactoryCellView.Factory({
                    viewFactory: viewFactory
                })
            };
        },

        culturalFitColumn: function() {
            var viewFactory = new core.factory.Factory(ui.rating.stars.views.RatingStarsView,
                function(options) {
                    return {
                        model: options.model,
                        attribute: 'culturalFitScore',
                        readonly: true,
                        starImageClass: 'rating-star-image-white'
                    };
            });

            return {
                column: 'Cultural Fit',
                cellView: new ui.grid.views.GridFactoryCellView.Factory({
                    viewFactory: viewFactory
                })
            };
        },

        averageColumn: function() {
            var viewFactory = new core.factory.Factory(ui.rating.stars.views.RatingStarsView,
                function(options) {
                    var model = new Backbone.Model({
                        average: options.model.averageScore()
                    });
                    return {
                        model: model,
                        attribute: 'average',
                        readonly: true,
                        starImageClass: 'rating-star-image-white'
                    };
            });

            return {
                column: 'Average',
                cellView: new ui.grid.views.GridFactoryCellView.Factory({
                    viewFactory: viewFactory
                })
            };
        },

        voteColumn: function(application) {
            var viewFactory = new core.factory.Factory(EvalGridVoteView, {});
            return {
                column: 'Vote',
                cellView: new ui.grid.views.GridFactoryCellView.Factory({
                    viewFactory: viewFactory
                })
            };
        }
    });

    
    /**
     * Team Eval View
     */
    var TeamEvalView = core.view.View.extend({

        /**
         * @constructs
         * @param {object} options Options object
         * @param {Application} options.model Application model
         */
        initialize: function(options) {
            options = _.extend({
                template: this.defaultTemplate
            }, options);

            this.model = options.model;
            this.evalCollection = new eval_models.EvalCollection();
            this.template = _.template(options.template);

            //bind events
            this.listenTo(this.evalCollection, 'reset', this.onReset);

            //load data
            this.evalCollection.fromApplication(this.model);

            //child views
            this.gridView = null;
            this.initChildViews();
        },

        defaultTemplate: team_eval_template,

        childViews: function() {
            return [
                this.gridView
            ];
        },

        initChildViews: function() {
            this.gridView = new EvalGridView({
                collection: this.evalCollection
            });
        },

        render: function() {
            this.$el.html(this.template());
            this.append(this.gridView);
            return this;
        },

        onReset: function() {
            this._addOverallEval();
        },

        _addOverallEval: function() {
            var scores = {
                'technicalScore': [],
                'communicationScore': [],
                'culturalFitScore': []
            };

            this.evalCollection.each(function(model) {
                _.each(scores, function(data, dimension) {
                    var score = model.get(dimension);
                    if(score) {
                        scores[dimension].push(score);
                    }
                }, this);
            }, this);

            this.evalCollection.add({
                'name': 'Overall',
                'technicalScore': core.array.average(scores.technicalScore),
                'communicationScore': core.array.average(scores.communicationScore),
                'culturalFitScore': core.array.average(scores.culturalFitScore)
            });
        }
    });

    return {
        TeamEvalView: TeamEvalView,
        EvalGridView: EvalGridView
    };
});
