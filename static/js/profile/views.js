define([
    'jQuery',
    'Underscore',
    'Backbone',
    'profile/models',
    'typeahead/views',
], function($, _, Backbone, models, typeahead) {

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
            this.model.setYrsExperience(parseInt(yrs));
        },

        clickedExpertise: function() {
            this.model.setExpertise(this.$el.find('.skill-expertise').val());
        },

        clickedDeleteItemButton: function() {
            if (null != this.collection.get(this.model)){
                this.collection.remove(this.model);
                this.model = null; // TODO mark for GC?
            }
        }
    });

    var SkillListView = Backbone.View.extend({

        initialize: function() {
            this.setElement($("#skill-list"));
            this.skillCollection = this.options.skillCollection;
            this.skillCollection.bind("reset", this.render, this);
            this.skillCollection.bind("add", this.addSkillView, this);
            this.skillCollection.bind("remove", this.render, this);
        },

        render: function() {
            this.$el.children().remove();
            this.skillCollection.each(this.addSkillView, this);
        },

        addSkillView: function(skill) {
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
            this.typeaheadView = new typeahead.TypeaheadView({
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
                if (null == this.skillCollection.get(skillName))
                {
                    var skill = new models.Skill({
                        name: skillName,
                        expertise: "None",
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
        templateName: '#position-item-hint-template',

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
            console.log(minSalary);
            this.model.setMinSalary(parseInt(minSalary));
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
            this.positionCollection.bind("reset", this.render, this);
            this.positionCollection.bind("add", this.addPositionView, this);
            this.positionCollection.bind("remove", this.render, this);
        },

        render: function() {
            this.$el.children().remove();
            if (this.positionCollection.length > 0) {
                this.positionCollection.each(this.addPositionView, this);
            } else {
                this.addPositionHintView();
            }
        },

        addPositionHintView: function() {
            var view = new JobPositionListItemHintView();
            this.$el.append(view.render().el);
        },

        addPositionView: function(position) {
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
            this.typeaheadView = new typeahead.TypeaheadView({
                el: this.$("#position-input"),
                maxResults: 5,
                forceSelection: true,
                onenter: this.updateOnEnter,
                context: this
            });

            this.positionTypeCollection = this.options.positionTypeCollection;
            this.positionCollection = this.options.positionCollection;
            this.positionInput = this.$("#position-input");
        },

        addPosition: function() {
            var positionName = this.positionInput.val();
            var positionTypeId = null;
            if (positionName) {
                var positions = this.positionTypeCollection.where({'name': positionName});
                if (1 == positions.length){
                    positionTypeId = (positions[0]).id;
                }
            }

            if (positionTypeId) {
                // only add if entry doesn't already exist in user's position prefs
                var posPrefs = this.positionCollection.where({'positionTypeId': positionTypeId});
                if (0 == posPrefs.length)
                {
                    var positionPref = new models.PositionPreference({
                        positionTypeId: positionTypeId
                    });
                    this.positionCollection.add(positionPref);
                }
                this.positionInput.val("");

            }
            this.positionInput.focus();
        },

        updateOnEnter: function(value) {
            this.addPosition();
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

    return {
        SkillListItemView: SkillListItemView,
        SkillListView: SkillListView,
        SkillAddView: SkillAddView,
        SkillFormView: SkillFormView,

        JobPositionListItemView: JobPositionListItemView,
        JobPositionListView: JobPositionListView,
        JobPositionAddView: JobPositionAddView,
        JobPositionFormView: JobPositionFormView
    }
});