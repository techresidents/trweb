define([
    'jQuery',
    'Underscore',
    'Backbone'
], function($, _, Backbone) {

    /**
     * Skill model is used to represent a user's skill in
     * any technology such as a language or framework.
     * @constructor
     * @param {Object} attributes Optional model attributes
     * @param {Object} options Optional model options.
     */
    var Skill = Backbone.Model.extend({

        idAttribute: "name",

        defaults : function() {
            return {
                name: "",
                expertise: "",
                yrs_experience: 0
            };
        },

        initialize: function(attributes, options) {

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
        /**
         * Skill collection is persisted locally.
         */
        localStorage: new Backbone.LocalStorage('SkillCollection'),
        model: Skill
    });

    /**
     * PositionType represents a specific type of job
     * such as Developer, Manager, etc.
     * @constructor
     * @param {Object} attributes Optional model attributes
     * @param {Object} options Optional model options.
     */
    var PositionType = Backbone.Model.extend({

        // This object will use the PositionType.id from the SQL db.
        // This is automatically mapped to this object's 'id' property.

        defaults : function() {
            return {
                name: "",
                description: ""
            };
        },

        initialize: function(attributes, options) {

        },

        name: function() {
            return this.get("name");
        },

        description: function() {
            return this.get("description");
        }
    });

    var PositionTypeCollection = Backbone.Collection.extend({
        /**
         * PositionType collection is persisted locally.
         */
        localStorage: new Backbone.LocalStorage('PositionTypeCollection'),
        model: PositionType
    });

    /**
     * PositionPreference is used to represent a user's
     * job preference when being solicited for new job
     * opportunities.
     * @constructor
     * @param {Object} attributes Optional model attributes
     * @param {Object} options Optional model options.
     */
    var PositionPreference = Backbone.Model.extend({

        defaults : function() {
            return {
                positionTypeId: null,
                min_salary: 50000
            };
        },

        initialize: function(attributes, options) {
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
        /**
         * PositionPref collection is persisted locally.
         */
        localStorage: new Backbone.LocalStorage('PositionPrefCollection'),
        model: PositionPreference
    });

    /**
     * TechnologyPreference is used to represent a user's
     * technology preference when being solicited for new job
     * opportunities.
     * @constructor
     * @param {Object} attributes Optional model attributes
     * @param {Object} options Optional model options.
     */
    var TechnologyPreference = Backbone.Model.extend({

        defaults : function() {
            return {
                technologyId: null,
                name: "",
                description: ""
            };
        },

        initialize: function(attributes, options) {

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
        /**
         * TechnologyPref collection is persisted locally.
         */
        localStorage: new Backbone.LocalStorage('TechnologyPrefCollection'),
        model: TechnologyPreference
    });

    /**
     * LocationPreference is used to represent a user's
     * location preference when being solicited for new job
     * opportunities.
     * @constructor
     * @param {Object} attributes Optional model attributes
     * @param {Object} options Optional model options.
     */
    var LocationPreference = Backbone.Model.extend({

        defaults : function() {
            return {
                locationId: null,
                city: "",
                state: "",
                zip: "",
                country: ""
            };
        },

        initialize: function(attributes, options) {

        },

        locationId: function() {
            return this.get('locationId');
        },

        city: function() {
            return this.get("city");
        },

        state: function() {
            return this.get("state");
        },

        zip: function() {
            return this.get("zip");
        },

        country: function() {
            return this.get("country");
        }
    });

    var LocationPrefCollection = Backbone.Collection.extend({
        /**
         * LocationPref collection is persisted locally.
         */
        localStorage: new Backbone.LocalStorage('LocationPrefCollection'),
        model: LocationPreference
    });

    /**
     * NotificationPreference is used to represent a user's
     * job notification preferences when being solicited for new job
     * opportunities.
     * @constructor
     * @param {Object} attributes Optional model attributes
     * @param {Object} options Optional model options.
     */
    var NotificationPreference = Backbone.Model.extend({

        /**
         * NotificationPreference model is persisted locally.
         */
        localStorage: new Backbone.LocalStorage('NotificationPreference'),

        defaults : function() {
            return {
                emailNewJobOpps: false
            };
        },

        initialize: function(attributes, options) {

        },

        /**
         * Boolean used to indicate if a user wants to be
         * notified about new job opportunities.
         * @return {Boolean} returns true if user want notifications
         */
        emailNewJobOpps: function() {
            return this.get("emailNewJobOpps");
        },

        setEmailNewJobOpps: function(isChecked) {
            this.set({emailNewJobOpps: isChecked});
        }
    });


    return {
        Skill: Skill,
        SkillCollection: SkillCollection,
        PositionType: PositionType,
        PositionTypeCollection: PositionTypeCollection,
        PositionPreference: PositionPreference,
        PositionPrefCollection: PositionPrefCollection,
        TechnologyPreference: TechnologyPreference,
        TechnologyPrefCollection: TechnologyPrefCollection,
        LocationPreference: LocationPreference,
        LocationPrefCollection: LocationPrefCollection,
        NotificationPreference: NotificationPreference
    };
});
