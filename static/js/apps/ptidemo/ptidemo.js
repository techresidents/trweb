define([
    'jQuery',
    'Underscore',
    'Backbone',
], function($, _, Backbone) {

    $(document).ready(function() {

        var AgendaItem = Backbone.Model.extend({

            defaults : function() {
                return {
                    topic: "X",
                    description: "XYZ",
                    duration: 300
                };
            },

            topic: function() {
                return this.get("topic");
            },

            description: function() {
                return this.get("description");
            },

            duration: function() {
                return this.get("duration");
            },

            setValues: function(topic, description, duration) {
                this.set({ topic: topic, description: description, duration: duration });
            }

        });



        var AgendaItemCollection = Backbone.Collection.extend({
            model: AgendaItem,
            selectedIndex: -1,

            select: function(id) {
                this.selectedIndex = this.indexOf(this.get(id));
                this.trigger("change:selection");
                return this;
            },

            selected: function() {
                return this.at(this.selectedIndex);
            }
        });



        var AgendaItemListView = Backbone.View.extend({
            tagName: "tr",

            template: _.template($('#item-template').html()),

            skillSet: null,

            events : {
                "click" : "select",
            },

            initialize: function() {
                this.skillSet = this.options.skillSet;
                this.model.bind("change", this.render, this);
                this.skillSet.bind("change:selection", this.selectionChanged, this);
            },

            render: function() {
                $(this.el).html(this.template(this.model.toJSON()));
                return this;
            },

            select: function() {
                this.skillSet.select(this.model.id);
            },

            isSelected: function() {
                var selected = this.skillSet.selected();
                if(selected && selected.id == this.model.id) {
                    return true;
                } else {
                    return false;
                }
            },

            selectionChanged: function() {
                if(this.isSelected()) {
                    $(this.el).addClass("ui-selected");
                } else {
                    $(this.el).removeClass("ui-selected");
                }
            }
        });




        var PtiAppView = Backbone.View.extend({

            initialize: function() {
                this.agenda = new AgendaItemCollection();
                this.agenda.bind("change", this.changed, this);
                this.agendaView = new AgendaItemListView({skillSet: this.skillSet});
            },

            changed: function(skill) {
                if(skill.expertise() != 0 && skill.experience() != 0) {
                    this.skillSet.selectNext();
                }
            }

        });

        app = new PtiAppView();

    }); //end ready

});
