define([
    'jQuery',
    'Underscore',
    'Backbone',
], function($, _, Backbone) {

    var Skill = Backbone.Model.extend({

        idAttribute: "name",

        defaults : function() {
            return {
                name: "",
                expertise: "",
                yrs_experience: 0
            };
        },

        initialize: function() {

        },

        name: function() {
            return this.get("name");
        },

        expertise: function() {
            return this.get("expertise");
        },

        experience: function() {
            return this.get("yrs_experience");
        },

        setYrsExperience: function(yrs_experience) {
            this.set({yrs_experience: yrs_experience});
        },

        setExpertise: function(expertise) {
            this.set({expertise: expertise});
        },

        setValues: function(expertise, yrs_experience) {
            this.set({ expertise: expertise, yrs_experience: yrs_experience });
        }

    });

    var SkillCollection = Backbone.Collection.extend({
        model: Skill
    });

    return {
        Skill: Skill,
        SkillCollection: SkillCollection
    }
});
