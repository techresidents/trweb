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

    var PositionType = Backbone.Model.extend({

        // This object will use the PositionType.id from the SQL db.
        // This is automatically mapped to this object's 'id' property.

        defaults : function() {
            return {
                name: "",
                description: ""
            };
        },

        initialize: function() {

        },

        name: function() {
            return this.get("name");
        },

        description: function() {
            return this.get("description");
        }
    });

    var PositionTypeCollection = Backbone.Collection.extend({
        model: PositionType
    });

    var PositionPreference = Backbone.Model.extend({

        defaults : function() {
            return {
                positionTypeId: null,
                min_salary: 50000
            };
        },

        initialize: function() {
        },

        positionTypeId: function() {
          return this.get('positionTypeId');
        },

        min_salary: function() {
            return this.get('min_salary');
        },

        setMinSalary: function(minSalary) {
            this.set({min_salary: minSalary});
        }
    });

    var PositionPrefCollection = Backbone.Collection.extend({
        model: PositionPreference
    });

    var TechnologyPreference = Backbone.Model.extend({

        // This object will use the Technology.id from the SQL db.
        // This is automatically mapped to this object's 'id' property.

        defaults : function() {
            return {
                technologyId: null,
                name: "",
                description: ""
            };
        },

        initialize: function() {

        },

        technologyId: function() {
            return this.get('technologyId');
        },

        name: function() {
            return this.get("name");
        },

        description: function() {
            return this.get("description");
        }
    });

    var TechnologyPrefCollection = Backbone.Collection.extend({
        model: TechnologyPreference
    });

    return {
        Skill: Skill,
        SkillCollection: SkillCollection,
        PositionType: PositionType,
        PositionTypeCollection: PositionTypeCollection,
        PositionPreference: PositionPreference,
        PositionPrefCollection: PositionPrefCollection,
        TechnologyPreference: TechnologyPreference,
        TechnologyPrefCollection: TechnologyPrefCollection
    }
});
