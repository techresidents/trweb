define([
    'jQuery',
    'Underscore',
    'Backbone',
    'chat/agenda/models',
    'timer/views',
    'timer/util',
], function($, _, Backbone, models, timer_views, timer_util) {

    
    /**
     * Agenda topic item view which represents a single Topic which
     * may be selected, active or both.
     * @constructor
     * @param {Object} options View options
     *   agenda: Agenda model (required) 
     *   model: Topic model (required)
     *   selectedClass: style to add when selected (optional)
     *   activeClass: style to add when active (optional)
     *   templateSelector: html template selector (optional)
     */
    var AgendaItemView = Backbone.View.extend({

        tagName: 'li',

        templateSelector: '#agenda-item-template',

        events: {
            'click': 'click',
        },

        initialize: function() {
            this.agenda = this.options.agenda;
            this.selectedClass = this.options.selectedClass || 'selected'
            this.activeClass = this.options.activeClass || 'active'
            this.templateSelector = this.options.templateSelector || this.templateSelector;
            this.template = _.template($(this.templateSelector).html());

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


    /**
     * Agenda topic list view.
     * @constructor
     * @param {Object} options View options
     *   model: Agenda model (required) 
     */
    var AgendaListView = Backbone.View.extend({

        tagName: 'ul',

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

    /**
     * Agenda detail view.
     * @constructor
     * @param {Object} options View options
     *   templateSelector: html template selector (optional)
     */
    var AgendaDetailView = Backbone.View.extend({

        templateSelector: '#agenda-detail-template',

        initialize: function() {
            this.templateSelector = this.options.templateSelector || this.templateSelector;
            this.template = _.template($(this.templateSelector).html());
            this.model.bind('change:selected', this.render, this);
        },


        render: function() {
            var topic = this.model.selected();
            if(topic) {
                var attributes =_.extend(topic.toJSON(), {
                    durationFormat: timer_util.formatTimer(topic.durationMs())
                });
                this.$el.html(this.template(attributes));
            }

            return this;
        }
    });


    /**
     * Agenda control view.
     * @constructor
     * @param {Object} options View options
     *   model: Agenda model (required)
     *   templateSelector: html template selector (optional)
     *   timerSelector: el selector for timer view (optional)
     */
    var AgendaControlView = Backbone.View.extend({

        templateSelector: '#agenda-control-template',

        timerSelector: '#agenda-control-timer',

        events: {
            "click .next": "next", 
        },

        initialize: function() {
            this.timerSelector = this.options.timerSelector || this.timerSelector;
            this.templateSelector = this.options.templateSelector || this.templateSelector;
            this.template = _.template($(this.templateSelector).html());
            this.timer = null;
            this.model.bind('change:active', this.activeChanged, this);
        },

        render: function() {
            var topic = this.model.topics().first();
            if(topic) {
                this.$el.html(this.template(topic.toJSON()));

                this.timer = new timer_views.DurationTimerView({
                    el: this.timerSelector,
                    duration: topic.durationMs(),
                    interval: 500,
                }).render();
            }

            return this;
        },

        next: function() {
            this.model.activateNext();
        },

        activeChanged: function() {
            var topic = this.model.active();
            if(topic) {
                if(topic.rank() === 0) {
                    this.timer.start();
                }
            } else {
                this.timer.stop();
            }
        },
    });
    

    /**
     * Agenda tab view.
     * @constructor
     * @param {Object} options View options
     *   controlSelector: el selector for AgendaControlView
     *   detailSelector: el selector for AgendaDetailView
     *   listSelect: el selector for AgendaListView
     */
    var ChatAgendaTabView = Backbone.View.extend({

        controlSelector: '#agenda-control',

        detailSelector: '#agenda-detail',

        listSelector: 'ul',
        
        initialize: function() {
            this.controlSelector = this.options.controlSelector || this.controlSelector;
            this.listSelector = this.options.listSelector || this.listSelector;
            this.detailSelector = this.options.detailSelector || this.detailSelector;
        },

        render: function() {
            models.agenda.selectNext();

            new AgendaControlView({
                el: this.$(this.controlSelector),
                model: models.agenda
            }).render();

            new AgendaListView({
                el: this.$(this.listSelector),
                model: models.agenda
            }).render();

            new AgendaDetailView({
                el: this.$(this.detailSelector),
                model: models.agenda
            }).render();

            return this;
        },
    });

    return {
        ChatAgendaTabView: ChatAgendaTabView,
    };
});
