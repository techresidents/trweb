define([
    'jQuery',
    'Underscore',
    'Backbone',
    'profile/models',
    'profile/views',
], function($, _, Backbone, models, views) {

$(document).ready(function() {

    var SkillsAppView = Backbone.View.extend({

            initialize: function() {
                this.skillSet = new models.SkillCollection();

                this.skillListView = new views.SkillListView({skillCollection: this.skillSet});
                this.skillAddView = new views.SkillAddView({skillCollection: this.skillSet});
                this.skillFormView = new views.SkillFormView({skillCollection: this.skillSet});

                this.skillSet.reset(this.options.data);
            }
    });

    var JobsAppView = Backbone.View.extend({

        initialize: function() {
            // Create collections
            this.positionTypeCollection = new models.PositionTypeCollection();
            this.positionPrefCollection = new models.PositionPrefCollection();
            this.technologyPrefCollection = new models.TechnologyPrefCollection();
            this.locationPrefCollection = new models.LocationPrefCollection();


            // Position Views
            this.positionListView = new views.JobPositionListView({
                positionCollection: this.positionPrefCollection,
                positionTypeCollection: this.positionTypeCollection
            });
            this.positionAddView = new views.JobPositionAddView({
                positionCollection: this.positionPrefCollection,
                positionTypeCollection: this.positionTypeCollection
            });
            this.positionFormView = new views.JobPositionFormView({
                positionCollection: this.positionPrefCollection
            });


            // Technology Views
            this.technologyListView = new views.JobTechnologyListView({
                technologyCollection: this.technologyPrefCollection
            });
            this.technologyAddView = new views.JobTechnologyAddView({
                technologyCollection: this.technologyPrefCollection
            });
            this.technologyFormView = new views.JobTechnologyFormView({
                technologyCollection: this.technologyPrefCollection
            });


            // Location Views
            this.locationListView = new views.JobLocationListView({
                locationCollection: this.locationPrefCollection
            });
            this.locationAddView = new views.JobLocationAddView({
                locationCollection: this.locationPrefCollection
            });
            this.locationFormView = new views.JobLocationFormView({
                locationCollection: this.locationPrefCollection
            });


            // Initialize collections
            this.positionTypeCollection.reset(this.options.positionTypes);
            this.positionPrefCollection.reset(this.options.positions);
            this.technologyPrefCollection.reset(this.options.technologies);
            this.locationPrefCollection.reset(this.options.locations);
        }
    });

    if (window.app) {
        if (window.app.name == 'jobs') {
            app = new JobsAppView({
                positions: window.positions,
                positionTypes: window.positionTypes,
                technologies: window.technologies,
                locations: window.locations
            });
        }
        else if (window.app.name == 'skills') {
            app = new SkillsAppView({data: window.data});
        }
    }


});

});
