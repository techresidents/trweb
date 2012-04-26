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
            this.positionCollection = new models.JobPositionCollection();

            this.positionLisView = new views.JobPositionListView({positionCollection: this.positionCollection});
            this.positionAddView = new views.JobPositionAddView({positionCollection: this.positionCollection});
            this.positionFormView = new views.JobPositionFormView({positionCollection: this.positionCollection});

            this.positionCollection.reset(this.options.data);
        }
    });

    if (window.app) {
        if (window.app.name == 'jobs') {
            app = new JobsAppView({data: window.data});
        }
        else if (window.app.name == 'skills') {
            app = new SkillsAppView({data: window.data});
        }
    }


});

});
