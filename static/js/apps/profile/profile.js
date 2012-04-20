define([
    'jQuery',
    'Underscore',
    'Backbone',
    'typeahead/views'
], function($, _, Backbone, typeahead) {

$(document).ready(function() {

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

    var SkillListItemView = Backbone.View.extend({

        tagName: "tr",
        template: _.template($('#skill-item-template').html()),
        events: {
            "change .skill-yrs-experience": "clickedYrsExperience",
            "change .skill-expertise": "clickedExpertise",
            "click .close": "clickedDeleteItemButton"
        },

        initialize: function() {
            this.model = this.options.model;
            this.collection = this.options.collection;
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
                    var skill = new Skill({
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

    var ProfileAppView = Backbone.View.extend({

            initialize: function() {
                this.skillSet = new SkillCollection();

                this.skillListView = new SkillListView({skillCollection: this.skillSet});
                this.skillAddView = new SkillAddView({skillCollection: this.skillSet});
                this.skillFormView = new SkillFormView({skillCollection: this.skillSet});

                this.skillSet.reset(this.options.data);
            }
    });

    app = new ProfileAppView({data: window.data});

});

});
