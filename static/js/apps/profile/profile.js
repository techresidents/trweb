define([
    'jQuery',
    'Underscore',
    'Backbone',
    'profile/models',
    'profile/views',
], function($, _, Backbone, models, views) {

$(document).ready(function() {

    var ProfileAppView = Backbone.View.extend({

            initialize: function() {
                this.skillSet = new models.SkillCollection();

                this.skillListView = new views.SkillListView({skillCollection: this.skillSet});
                this.skillAddView = new views.SkillAddView({skillCollection: this.skillSet});
                this.skillFormView = new views.SkillFormView({skillCollection: this.skillSet});

                this.skillSet.reset(this.options.data);
            }
    });

    app = new ProfileAppView({data: window.data});

});

});
