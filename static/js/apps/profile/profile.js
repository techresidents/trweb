define([
    'jQuery',
    'Underscore',
    'Backbone',
    'typeahead/views'
], function($, _, Backbone, typeahead) {

$(document).ready(function() {

    var Skill = Backbone.Model.extend({
    
            defaults : function() {
                return {
                    id: null,
                    name: "",
                    expertise: "",
                    yrs_experience: 0
                };
            },

            initialize: function() {
                if(this.get("id") == null) {
                    this.set({ id: this.cid });
                }
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
            model: Skill,
            //localStorage: new Store("skills"),
            selectedIndex: -1,
    
            select: function(id) {
                this.selectedIndex = this.indexOf(this.get(id));
                this.trigger("change:selection");
                return this;
            },
    
            selectNext: function() {
                if(this.selectedIndex < this.length - 1) {
                    this.selectedIndex++;
                } else {
                    this.selectedIndex = -1;
                }
                this.trigger("change:selection");
                return this;
            },
    
            selected: function() {
                return this.at(this.selectedIndex);
            }
    });

    var SkillListItemView = Backbone.View.extend({

        tagName: "tr",
        template: _.template($('#skill-item-template').html()),
        events: {
            "change .skill-yrs-experience": "clickedYrsExperience",
            "change .skill-expertise": "clickedExpertise"
        },

        initialize: function() {
            this.model = this.options.model;
        },

        render: function() {
            $(this.el).html(this.template(this.model.toJSON()));
            $(this.el).find('.skill-yrs-experience').val(this.model.experience());
            $(this.el).find('.skill-expertise').val(this.model.expertise());
            return this;
        },

        clickedYrsExperience: function() {
            this.model.setYrsExperience($(this.el).find('.skill-yrs-experience').val());
        },

        clickedExpertise: function() {
            console.log("clickedExpertise called")
            this.model.setExpertise($(this.el).find('.skill-expertise').val());
        }
    });

    var SkillListView = Backbone.View.extend({

        el: $("#skill-list"),

        initialize: function() {
            this.skillCollection = this.options.skillCollection;
            this.skillCollection.bind("reset", this.render, this);
            this.skillCollection.bind("add", this.addSkillView, this);
        },

        render: function() {
            this.el.children().remove();
            this.skillCollection.each(this.addSkillView, this);
        },

        addSkillView: function(skill) {
            var view = new SkillListItemView({
                model: skill
            });

            this.el.append(view.render().el);
        }
    });

    var SkillAddView = Backbone.View.extend({

        el: $("#skill-add"),

        events: {
            "click button": "addSkill"
        },

        initialize: function() {
            this.typeaheadView = new typeahead.TypeaheadView({
                el: this.$("#skill-input"),
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
                if (!this.skillCollection.find(this.skillExists, this)) {
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
        },

        skillExists: function(model) {
            ret = (this.skillInput.val() == model.name());
            return ret
        }
    });

    var SkillFormView = Backbone.View.extend({

        el: $("#skill-form"),

        initialize: function() {
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

                console.log("Input data:")
                console.log(this.options.data)

                this.skillSet.reset(this.options.data);
                console.log('SkillCollection data:')
                console.log(this.skillSet)
            }
    });

    app = new ProfileAppView({data: window.data});

});

});
