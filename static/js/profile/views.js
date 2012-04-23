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


    var JobPositionListItemView = Backbone.View.extend({

        tagName: "li",
        templateName: '#position-item-template',
        events: {
            "click .close": "clickedDeleteItemButton"
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

        clickedDeleteItemButton: function() {
            if (null != this.collection.get(this.model)){
                this.collection.remove(this.model);
                this.model = null; // TODO mark for GC?
            }
        }
    });

    var JobPositionListView = Backbone.View.extend({

        initialize: function() {
            this.setElement($("#positions-list"));
            this.positionCollection = this.options.positionCollection;
            this.positionCollection.bind("reset", this.render, this);
            this.positionCollection.bind("add", this.addPositionView, this);
            this.positionCollection.bind("remove", this.render, this);
        },

        render: function() {
            this.$el.children().remove();
            this.positionCollection.each(this.addPositionView, this);
        },

        addPositionView: function(position) {
            var view = new JobPositionListItemView({
                model: position,
                collection: this.positionCollection
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
                el: this.$("#id_positions"),
                maxResults: 5,
                forceSelection: true,
                onenter: this.updateOnEnter,
                context: this
            });

            this.positionCollection = this.options.positionCollection;
            this.positionInput = this.$("#id_positions");
        },

        addPosition: function() {
            console.log("addPosition called")
            var positionName = this.positionInput.val();
            if (positionName) {
                // only add if entry doesn't exist
                if (null == this.positionCollection.get(positionName))
                {
                    var position = new models.JobPosition({
                        name: positionName
                    });
                    this.positionCollection.add(position);
                }
                this.positionInput.val("");

            }
            this.positionInput.focus();
        },

        updateOnEnter: function(value) {
            this.addPosition();
        }

    });



    return {
        SkillListItemView: SkillListItemView,
        SkillListView: SkillListView,
        SkillAddView: SkillAddView,
        SkillFormView: SkillFormView,

        JobPositionListItemView: JobPositionListItemView,
        JobPositionListView: JobPositionListView,
        JobPositionAddView: JobPositionAddView
    }
});