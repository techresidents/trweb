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
            this.positionTypeCollection = new models.PositionTypeCollection();
            this.positionPrefCollection = new models.PositionPrefCollection();

            this.positionLisView = new views.JobPositionListView({
                positionCollection: this.positionPrefCollection,
                positionTypeCollection: this.positionTypeCollection
            });
            this.positionAddView = new views.JobPositionAddView({
                positionCollection: this.positionPrefCollection,
                positionTypeCollection: this.positionTypeCollection
            });
            this.positionFormView = new views.JobPositionFormView({positionCollection: this.positionPrefCollection});

            this.positionTypeCollection.reset(this.options.positionTypes);
            this.positionPrefCollection.reset(this.options.positions);
        }
    });

    if (window.app) {
        if (window.app.name == 'jobs') {
            app = new JobsAppView({positions: window.positions, positionTypes: window.positionTypes});
        }
        else if (window.app.name == 'skills') {
            app = new SkillsAppView({data: window.data});
        }
    }


});

});
