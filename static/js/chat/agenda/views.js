define([
    'jQuery',
    'Underscore',
    'Backbone',
    'chat/agenda/models'
], function($, _, Backbone, models) {

    var AgendaItemView = Backbone.View.extend({

            tagName: 'li',

            template: '#agenda-item-template',

            events: {
                'click': 'click',
            },

            initialize: function() {
                this.agenda = this.options.agenda;
                this.template = _.template($(this.template).html());
                this.selectedClass = this.options.selectedClass || 'selected'
                this.activeClass = this.options.activeClass || 'active'

                this.agenda.bind('change:selected', this.selectedChange, this);
                this.agenda.bind('change:active', this.activeChange, this);
            },
            
            isSelected: function() {
                return this.agenda.selected() === this.model;
            },

            isActive: function() {
                return this.agenda.active() === this.model;
            },
            
            render: function() {
                this.$el.html(this.template(this.model.toJSON()));
                if(this.isSelected()) {
                    this.$el.addClass(this.selectedClass);
                }
                if(this.isActive()) {
                    this.$el.addClass(this.activeClass);
                }
                return this;
            },
            
            click: function() {
                this.agenda.select(this.model);
            },

            selectedChange: function() {
                if(this.isSelected()) {
                    this.$el.addClass(this.selectedClass);
                } else {
                    this.$el.removeClass(this.selectedClass);
                }
            },

            activeChange: function() {
                if(this.isActive()) {
                    this.$el.addClass(this.activeClass);
                } else {
                    this.$el.removeClass(this.activeClass);
                }
            },
    });

    var AgendaListView = Backbone.View.extend({

            initialize: function() {
                this.model.topics().bind("reset", this.render, this);
            },

            render: function() {
                this.$el.empty();

                this.model.topics().each(function(topic) {
                    var view = new AgendaItemView({
                        model: topic,
                        agenda: this.model
                    });
                    this.$el.append(view.render().el);
                }, this);

                return this;
            }
    });

    var AgendaDetailView = Backbone.View.extend({

            template: '#agenda-detail-template',

            initialize: function() {
                this.model.bind('change:selected', this.render, this);
                this.template = _.template($(this.template).html());
            },


            render: function() {
                this.$el.empty();

                var topic = this.model.selected();
                if(topic) {
                    this.$el.html(this.template(topic.toJSON()));
                }

                return this;
            }
    });

    var AgendaControlView = Backbone.View.extend({

            template: '#agenda-control-template',

            initialize: function() {
                this.model.bind('change:selected', this.render, this);
                this.template = _.template($(this.template).html());
            },


            render: function() {
                this.$el.empty();

                var topic = this.model.selected();
                if(topic) {
                    this.$el.html(this.template(topic.toJSON()));
                }

                return this;
            }
    });
    
    var ChatAgendaTabView = Backbone.View.extend({
            
            initialize: function() {
            },

            render: function() {
                models.agenda.selectNext();
                models.agenda.activateNext();

                new AgendaListView({
                    el: this.$('ul'),
                    model: models.agenda
                }).render();

                new AgendaDetailView({
                    el: this.$('#agenda-detail'),
                    model: models.agenda
                }).render();

                return this;
            },
    });

    return {
        ChatAgendaTabView: ChatAgendaTabView,
    };
});
