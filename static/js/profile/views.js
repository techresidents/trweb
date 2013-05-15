define([
    'jquery',
    'underscore',
    'backbone',
    'profile/models',
    'typeahead',
    'lookup'
], function($, _, Backbone, models, typeahead, lookup) {


    var SkillListItemHintView = Backbone.View.extend({

        tagName: "tr",
        templateName: '#item-hint-template',

        initialize: function() {
            this.template = _.template($(this.templateName).html());
        },

        render: function() {
            this.$el.html(this.template());
            this.$el.addClass('hint-row');
            return this;
        }
    });

    var SkillListItemView = Backbone.View.extend({

        tagName: "tr",
        template: '#skill-item-template',
        events: {
            "change .skill-yrs-experience": "clickedYrsExperience",
            "change .skill-expertise": "clickedExpertise",
            "click .close": "clickedDeleteItemButton"
        },

        initialize: function() {
            this.model = this.options.model;
            this.collection = this.options.collection;
            this.template = _.template($(this.template).html());
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            this.$el.find('.skill-yrs-experience').val(this.model.experience());
            this.$el.find('.skill-expertise').val(this.model.expertise());
            return this;
        },

        clickedYrsExperience: function() {
            var yrs = this.$el.find('.skill-yrs-experience').val();
            this.model.setYrsExperience(parseInt(yrs, 10));
        },

        clickedExpertise: function() {
            this.model.setExpertise(this.$el.find('.skill-expertise').val());
        },

        clickedDeleteItemButton: function() {
            if (null !== this.collection.get(this.model)){
                this.collection.remove(this.model);
                this.model = null; // TODO mark for GC?
            }
        }
    });

    var SkillListView = Backbone.View.extend({

        initialize: function() {
            this.setElement($("#skill-list"));
            this.isHintRowVisible = false;
            this.skillCollection = this.options.skillCollection;
            this.skillCollection.bind("reset", this.render, this);
            this.skillCollection.bind("add", this.addSkillView, this);
            this.skillCollection.bind("remove", this.render, this);
        },

        render: function() {
            this.$el.children().remove();
            if (0 === this.skillCollection.length) {
                this.addSkillHintView();
                this.isHintRowVisible = true;
            }
            this.skillCollection.each(this.addSkillView, this);
        },

        addSkillHintView: function() {
            var view = new SkillListItemHintView();
            this.$el.append(view.render().el);
        },

        removeSkillHintView: function() {
            this.$el.children().remove();
            this.isHintRowVisible = false;
        },

        addSkillView: function(skill) {
            if (this.isHintRowVisible) {
                this.removeSkillHintView();
            }
            var view = new SkillListItemView({
                model: skill,
                collection: this.skillCollection
            });

            this.$el.append(view.render().el);
        },

        removeSkillView: function(skill) {
            // TODO would be preferable to only remove the item we want instead of resetting the collection.
        }
    });

    var SkillAddView = Backbone.View.extend({

        events: {
            "click button": "addSkill"
        },

        initialize: function() {
            this.setElement($("#skill-add"));
            this.typeaheadView = new typeahead.views.TypeaheadView({
                el: this.$("#skill-input"),
                maxResults: 5,
                forceSelection: true,
                onenter: this.updateOnEnter,
                context: this
            });

            this.skillCollection = this.options.skillCollection;
            this.skillInput = this.$("#skill-input");
        },

        addSkill: function() {
            var skillName = this.skillInput.val();
            if (skillName) {
                // only add if entry doesn't exist
                if (!this.skillCollection.get(skillName))
                {
                    var skill = new models.Skill({
                        name: skillName,
                        expertise: "Novice",
                        yrs_experience: 0
                    });
                    this.skillCollection.add(skill);
                }
                this.skillInput.val("");

            }
            this.skillInput.focus();
        },

        updateOnEnter: function(value) {
            this.addSkill();
        }
    });

    var SkillFormView = Backbone.View.extend({

        initialize: function() {
            this.setElement($("#skill-form"));
            this.skillCollection = this.options.skillCollection;
            this.skillCollection.bind("reset", this.change, this);
            this.skillCollection.bind("add", this.change, this);
            this.skillCollection.bind("remove", this.change, this);
            this.skillCollection.bind("change", this.change, this);

            this.skillsFormInput = this.$("#skill-form-input");
        },

        change: function() {
            this.skillsFormInput.val(JSON.stringify(this.skillCollection.toJSON()));
        }
    });



    var JobPositionListItemHintView = Backbone.View.extend({

        tagName: "tr",
        templateName: '#item-hint-template',

        initialize: function() {
            this.template = _.template($(this.templateName).html());
        },

        render: function() {
            this.$el.html(this.template());
            this.$el.addClass('hint-row');
            return this;
        }
    });

    var JobPositionListItemView = Backbone.View.extend({

        tagName: "tr",
        templateName: '#position-item-template',
        events: {
            "change .min-salary-option": "clickedMinSalary",
            "click .close": "clickedDeleteItemMarker"
        },

        initialize: function() {
            this.model = this.options.model;
            this.collection = this.options.collection;
            this.positionTypeCollection = this.options.positionTypeCollection;
            this.template = _.template($(this.templateName).html());
        },

        render: function() {
            this.$el.html(this.template(
                _.extend(this.model.toJSON(), this.positionTypeCollection.get(this.model.positionTypeId()).toJSON())
            ));
            this.$el.find('.min-salary-option').val(this.model.min_salary());
            return this;
        },

        clickedMinSalary: function() {
            var minSalary = this.$el.find('.min-salary-option').val();
            this.model.setMinSalary(parseInt(minSalary, 10));
        },

        clickedDeleteItemMarker: function() {
            this.collection.remove(this.model);
            this.model = null; // TODO mark for GC?
        }
    });

    var JobPositionListView = Backbone.View.extend({

        initialize: function() {
            this.setElement($("#user-positions-list"));
            this.positionTypeCollection = this.options.positionTypeCollection;
            this.positionCollection = this.options.positionCollection;
            this.isHintRowVisible = false;
            this.positionCollection.bind("reset", this.render, this);
            this.positionCollection.bind("add", this.addPositionView, this);
            this.positionCollection.bind("remove", this.render, this);
        },

        render: function() {
            this.$el.children().remove();
            if (0 === this.positionCollection.length) {
                this.addPositionHintView();
                this.isHintRowVisible = true;
            }
            this.positionCollection.each(this.addPositionView, this);
        },

        addPositionHintView: function() {
            var view = new JobPositionListItemHintView();
            this.$el.append(view.render().el);
        },

        removePositionHintView: function() {
            this.$el.children().remove();
            this.isHintRowVisible = false;
        },

        addPositionView: function(position) {
            if (this.isHintRowVisible) {
                this.removePositionHintView();
            }
            var view = new JobPositionListItemView({
                model: position,
                collection: this.positionCollection,
                positionTypeCollection: this.positionTypeCollection
            });

            this.$el.append(view.render().el);
        },

        removePositionView: function(skill) {
            // TODO would be preferable to only remove the item we want instead of resetting the collection.
        }
    });

    var JobPositionAddView = Backbone.View.extend({

        events: {
            "click button": "addPosition"
        },

        initialize: function() {
            this.setElement($("#position-add"));
            this.positionTypeCollection = this.options.positionTypeCollection;
            this.positionCollection = this.options.positionCollection;
            this.positionInput = this.$("#position-input");
        },

        addPosition: function() {
            var positionName = this.positionInput.val();
            var positionTypeId = null;
            if (positionName) {
                var positions = this.positionTypeCollection.where({'name': positionName});
                if (1 === positions.length){
                    positionTypeId = (positions[0]).id;
                }
            }

            if (positionTypeId) {
                // only add if entry doesn't already exist in user's position prefs
                var posPrefs = this.positionCollection.where({'positionTypeId': positionTypeId});
                if (0 === posPrefs.length)
                {
                    var positionPref = new models.PositionPreference({
                        positionTypeId: positionTypeId
                    });
                    this.positionCollection.add(positionPref);
                }
                this.positionInput.val("");

            }
            this.positionInput.focus();
        }

    });

    var JobPositionFormView = Backbone.View.extend({

        initialize: function() {
            this.setElement($("#profile-jobs-form"));
            this.positionCollection = this.options.positionCollection;
            this.positionCollection.bind("reset", this.change, this);
            this.positionCollection.bind("add", this.change, this);
            this.positionCollection.bind("remove", this.change, this);
            this.positionCollection.bind("change", this.change, this);

            this.positionsFormInput = this.$("#positions-form-input");
        },

        change: function() {
            this.positionsFormInput.val(JSON.stringify(this.positionCollection.toJSON()));
        }
    });



    var JobTechnologyListItemHintView = Backbone.View.extend({

        tagName: "tr",
        templateName: '#technology-item-hint-template',

        initialize: function() {
            this.template = _.template($(this.templateName).html());
        },

        render: function() {
            this.$el.html(this.template());
            this.$el.addClass('hint-row');
            return this;
        }

    });

    var JobTechnologyListItemView = Backbone.View.extend({

        tagName: "tr",
        templateName: '#technology-item-template',
        events: {
            "click .close": "clickedDeleteItemMarker"
        },

        initialize: function() {
            this.model = this.options.model;
            this.collection = this.options.collection;
            this.template = _.template($(this.templateName).html());
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },

        clickedDeleteItemMarker: function() {
            this.collection.remove(this.model);
            this.model = null; // TODO mark for GC?
        }
    });

    var JobTechnologyListView = Backbone.View.extend({

        initialize: function() {
            this.setElement($("#jobs-technology-list"));
            this.technologyCollection = this.options.technologyCollection;
            this.isHintRowVisible = false;
            this.technologyCollection.bind("reset", this.render, this);
            this.technologyCollection.bind("add", this.addTechnologyView, this);
            this.technologyCollection.bind("remove", this.render, this);
        },

        render: function() {
            this.$el.children().remove();
            if (0 === this.technologyCollection.length) {
                this.addTechnologyHintView();
                this.isHintRowVisible = true;
            }
            this.technologyCollection.each(this.addTechnologyView, this);
        },

        addTechnologyHintView: function() {
            var view = new JobTechnologyListItemHintView();
            this.$el.append(view.render().el);
        },

        removeTechnologyHintView: function() {
            this.$el.children().remove();
            this.isHintRowVisible = false;
        },

        addTechnologyView: function(technologyPref) {
            if (this.isHintRowVisible){
                this.removeTechnologyHintView();
            }
            var view = new JobTechnologyListItemView({
                model: technologyPref,
                collection: this.technologyCollection
            });

            this.$el.append(view.render().el);
        },

        removeTechnologyView: function(skill) {
            // TODO would be preferable to only remove the item we want instead of resetting the collection.
        }
    });

    var JobTechnologyAddView = Backbone.View.extend({

        events: {
            "click button": "addTechnology"
        },

        initialize: function() {
            this.setElement($('#technology-add'));

            this.lookupValue = null;
            this.lookupData = null;

            new lookup.views.LookupView({
                el: this.$("#technology-input"),
                scope: 'technology',
                property: 'name',
                forceSelection: true,
                onenter: this.updateOnEnter,
                onselect: this.updateOnSelect,
                context: this
            });

            this.technologyCollection = this.options.technologyCollection;
            this.technologyInput = this.$("#technology-input");
        },

        /**
         * Listen to the 'Add' button.
         */
        addTechnology: function() {
            var value = this.technologyInput.val();
            if (value.toLowerCase() === this.lookupValue.toLowerCase()) {
                // If this check passes, it implies that the value of this.lookupValue & this.lookupData
                // are up-to-date and accurate.
                this._add(this.lookupData);
            }
        },

        /**
         * Callback to be invoked when enter is pressed on the LookupView
         *
         * @param name  the string in the LookupView input
         * @param data  the LookupResult.matches object which is scope/category specific
         */
        updateOnEnter: function(name, data) {
            this._add(data);
        },

        /**
         * Callback to be invoked when a LookupView result is selected
         * either explicitly through the menu or implicitly
         * when focus is lost.
         *
         * @param value the string in the LookupView input
         * @param data LookupResult.matches object which is scope/category specific
         */
        updateOnSelect: function(value, data) {
            // keep a record of what was in the lookupView
            this.lookupValue = value;
            this.lookupData = data;
        },

        /**
         * Method to add a technology to the collection
         * @param data
         * @private
         */
        _add: function(data) {
            var technologyName = data.name;
            if (technologyName) {
                //only add if entry doesn't already exist in user's position prefs
                var techPrefs = this.technologyCollection.where({'technologyId': data.id});
                if (0 === techPrefs.length) {
                    var technologyPref = new models.TechnologyPreference({
                        technologyId: data.id,
                        name: data.name,
                        description: data.description
                    });
                    this.technologyCollection.add(technologyPref);
                }
                this.technologyInput.val("");
            }
            this.technologyInput.focus();
        }

    });

    var JobTechnologyFormView = Backbone.View.extend({

        initialize: function() {
            this.setElement($("#profile-jobs-form"));
            this.technologyCollection = this.options.technologyCollection;
            this.technologyCollection.bind("reset", this.change, this);
            this.technologyCollection.bind("add", this.change, this);
            this.technologyCollection.bind("remove", this.change, this);
            this.technologyCollection.bind("change", this.change, this);

            this.technologiesFormInput = this.$("#technologies-form-input");
        },

        change: function() {
            this.technologiesFormInput.val(JSON.stringify(this.technologyCollection.toJSON()));
        }
    });



    var JobLocationListItemHintView = Backbone.View.extend({

        tagName: "tr",
        templateName: '#item-hint-template',

        initialize: function() {
            this.template = _.template($(this.templateName).html());
        },

        render: function() {
            this.$el.html(this.template());
            this.$el.addClass('hint-row');
            return this;
        }

    });

    var JobLocationListItemView = Backbone.View.extend({

        tagName: "tr",
        templateName: '#location-item-template',
        events: {
            "click .close": "clickedDeleteItemMarker"
        },

        initialize: function() {
            this.model = this.options.model;
            this.collection = this.options.collection;
            this.template = _.template($(this.templateName).html());
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },

        clickedDeleteItemMarker: function() {
            this.collection.remove(this.model);
            this.model = null; // TODO mark for GC?
        }
    });

    var JobLocationListView = Backbone.View.extend({

        initialize: function() {
            this.setElement($("#jobs-location-list"));
            this.locationCollection = this.options.locationCollection;
            this.isHintRowVisible = false;
            this.locationCollection.bind("reset", this.render, this);
            this.locationCollection.bind("add", this.addLocationView, this);
            this.locationCollection.bind("remove", this.render, this);
        },

        render: function() {
            this.$el.children().remove();
            if (0 === this.locationCollection.length) {
                this.addLocationHintView();
                this.isHintRowVisible = true;
            }
            this.locationCollection.each(this.addLocationView, this);
        },

        addLocationHintView: function() {
            var view = new JobLocationListItemHintView();
            this.$el.append(view.render().el);
        },

        removeLocationHintView: function() {
            this.$el.children().remove();
            this.isHintRowVisible = false;
        },

        addLocationView: function(locationPref) {
            if (this.isHintRowVisible){
                this.removeLocationHintView();
            }
            var view = new JobLocationListItemView({
                model: locationPref,
                collection: this.locationCollection
            });

            this.$el.append(view.render().el);
        },

        removeLocationView: function(skill) {
            // TODO would be preferable to only remove the item we want instead of resetting the collection.
        }
    });

    var JobLocationAddView = Backbone.View.extend({

        events: {
            "click button": "addLocation"
        },

        initialize: function() {
            this.setElement($('#location-add'));

            this.lookupValue = null;
            this.lookupData = null;

            new lookup.views.LookupView({
                el: this.$("#location-input"),
                scope: 'location',
                property: 'name',
                forceSelection: true,
                onenter: this.updateOnEnter,
                onselect: this.updateOnSelect,
                context: this
            });

            this.locationCollection = this.options.locationCollection;
            this.locationInput = this.$("#location-input");
        },

        /**
         * Listen to the 'Add' button.
         */
        addLocation: function() {
            var value = this.locationInput.val();
            if (value.toLowerCase() === this.lookupData.name.toLowerCase()) {
                // If this check passes, it implies that the value of this.lookupValue & this.lookupData
                // are up-to-date and accurate.  This is to prevent a time-of-check versus time-of-use
                // bug.  This could occur if the user had selected an option in from the drop down menu,
                // then edited the location data within the field and finally pressed the 'add' button.
                this._add(this.lookupData);
            }
        },

        /**
         * Callback to be invoked when enter is pressed on the LookupView
         *
         * @param value  the string in the LookupView input
         * @param data  the LookupResult.matches object which is scope/category specific
         */
        updateOnEnter: function(value, data) {
            this._add(data);
        },

        /**
         * Callback to be invoked when a LookupView result is selected
         * either explicitly through the menu or implicitly
         * when focus is lost.
         *
         * @param value the string in the LookupView input
         * @param data LookupResult.matches object which is scope/category specific
         */
        updateOnSelect: function(value, data) {
            // keep track of what was in the lookupView
            this.lookupValue = value;
            this.lookupData = data;
        },

        /**
         * Method to add a location to the collection
         * @param data
         * @private
         */
        _add: function(data) {
            if (data) {
                //only add if entry doesn't already exist in user's location prefs
                var locationPrefs = this.locationCollection.where({'locationId': data.id});
                if (0 === locationPrefs.length) {
                    var locationPref = new models.LocationPreference({
                        locationId: data.id,
                        city: data.city,
                        state: data.state,
                        zip: data.zip,
                        country: data.country
                    });
                    this.locationCollection.add(locationPref);
                }
                this.locationInput.val("");
            }
            this.locationInput.focus();
        }

    });

    var JobLocationFormView = Backbone.View.extend({

        initialize: function() {
            this.setElement($("#profile-jobs-form"));
            this.locationCollection = this.options.locationCollection;
            this.locationCollection.bind("reset", this.change, this);
            this.locationCollection.bind("add", this.change, this);
            this.locationCollection.bind("remove", this.change, this);
            this.locationCollection.bind("change", this.change, this);

            this.locationsFormInput = this.$("#locations-form-input");
        },

        change: function() {
            this.locationsFormInput.val(JSON.stringify(this.locationCollection.toJSON()));
        }
    });



    var JobNotificationListView = Backbone.View.extend({

        events: {
            "click #id_email_new_job_opps": "toggleEmailNewJobOpps"
        },

        initialize: function() {
            this.setElement($("#jobs-notifications-list"));
            this.notificationPreference = this.options.notificationPreference;
            this.$('#id_email_new_job_opps').prop('checked', this.notificationPreference.emailNewJobOpps());
        },

        toggleEmailNewJobOpps: function() {
            this.notificationPreference.setEmailNewJobOpps(this.$('#id_email_new_job_opps').is(':checked'));
        }
    });

    var JobNotificationFormView = Backbone.View.extend({

        initialize: function() {
            this.setElement($("#profile-jobs-form"));
            this.notificationPreference = this.options.notificationPreference;
            this.notificationPreference.bind("change", this.change, this);
            this.notificationsFormInput = this.$("#notifications-form-input");
            this.change();
        },

        change: function() {
            this.notificationsFormInput.val(JSON.stringify(this.notificationPreference.toJSON()));
        }
    });


    return {
        SkillListItemView: SkillListItemView,
        SkillListView: SkillListView,
        SkillAddView: SkillAddView,
        SkillFormView: SkillFormView,

        JobPositionListItemView: JobPositionListItemView,
        JobPositionListView: JobPositionListView,
        JobPositionAddView: JobPositionAddView,
        JobPositionFormView: JobPositionFormView,

        JobTechnologyListItemView: JobTechnologyListItemView,
        JobTechnologyListView: JobTechnologyListView,
        JobTechnologyAddView: JobTechnologyAddView,
        JobTechnologyFormView: JobTechnologyFormView,

        JobLocationListItemView: JobLocationListItemView,
        JobLocationListView: JobLocationListView,
        JobLocationAddView: JobLocationAddView,
        JobLocationFormView: JobLocationFormView,

        JobNotificationListView: JobNotificationListView,
        JobNotificationFormView: JobNotificationFormView
    };
});
