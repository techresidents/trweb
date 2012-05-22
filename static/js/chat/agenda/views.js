define([
    'jQuery',
    'Underscore',
    'Backbone',
    'chat/agenda/models',
    'chat/minute/models',
    'chat/tag/models',
    'chat/tag/views',
    'timer/views',
    'timer/util',
    'text!chat/agenda/templates/agenda_control.html',
    'text!chat/agenda/templates/agenda_detail.html',
    'text!chat/agenda/templates/agenda_item.html',
    'text!chat/agenda/templates/agenda_tab.html',
    'text!chat/agenda/templates/agenda_tag.html',
], function(
    $,
    _,
    Backbone,
    models,
    minute_models,
    tag_models,
    tag_views,
    timer_views,
    timer_util,
    agenda_control_template,
    agenda_detail_template,
    agenda_item_template,
    agenda_tab_template,
    agenda_tag_template) {

    
    /**
     * Agenda topic item view which represents a single Topic which
     * may be selected, active or both.
     * @constructor
     * @param {Object} options View options
     *   agenda: Agenda model (required) 
     *   model: Topic model (required)
     *   selectedClass: style to add when selected (optional)
     *   activeClass: style to add when active (optional)
     */
    var AgendaItemView = Backbone.View.extend({

        tagName: 'li',

        events: {
            'click': 'click',
        },

        initialize: function() {
            this.agenda = this.options.agenda;
            this.selectedClass = this.options.selectedClass || 'selected'
            this.activeClass = this.options.activeClass || 'active'
            this.template = _.template(agenda_item_template);

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
     */
    var AgendaDetailView = Backbone.View.extend({

        initialize: function() {
            this.template = _.template(agenda_detail_template);
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
     * Agenda tag view.
     * @constructor
     * @param {Object} options View options
     */
    var AgendaTagView = Backbone.View.extend({

        listSelector: 'ul',

        initialize: function() {
            this.template = _.template(agenda_tag_template);
            this.model.bind('change:selected', this.selectedChange, this);
            this.listView = null;
        },

        render: function() {
            this.$el.html(this.template());

            this.listView = new tag_views.ChatTaggerListView({
                el: this.$(this.listSelector),
                collection: tag_models.tagCollection,
                filter: this.listViewTagFilter,
                context: this,
            }).render();

            return this;
        },

        selectedChange: function() {
            if(this.listView) {
                this.listView.applyFilter();
            }
        },

        listViewTagFilter: function(tag) {
            var result = false;

            var tagMinute = minute_models.minuteCollection.get(tag.minuteId());
            var tagTopic = this.model.topics().get(tagMinute.topicId());
            var selectedTopic = this.model.selected();
            
            var topic = tagTopic;
            while(topic) {
                if(topic.id === selectedTopic.id) {
                    result = true;
                    break;
                }
                topic = this.model.topics().get(topic.parentId());
            }

            return result;
        },
    });


    /**
     * Agenda control view.
     * @constructor
     * @param {Object} options View options
     *   model: Agenda model (required)
     *   timerSelector: el selector for timer view (optional)
     */
    var AgendaControlView = Backbone.View.extend({

        timerSelector: '#agenda-control-timer',

        events: {
            "click .next": "next", 
        },

        initialize: function() {
            this.template = _.template(agenda_control_template);
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
                if(this.timer.running === false) {
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
     */
    var ChatAgendaTabView = Backbone.View.extend({

        controlSelector: '#agenda-control',

        detailSelector: '#agenda-detail',

        listSelector: '#agenda-list',

        tagSelector: '#agenda-tag',
        
        initialize: function() {
            this.template = _.template(agenda_tab_template);
        },

        render: function() {
            models.agenda.selectNext();

            this.$el.html(this.template());

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

            new AgendaTagView({
                el: this.$(this.tagSelector),
                model: models.agenda
            }).render();

            return this;
        },
    });

    return {
        ChatAgendaTabView: ChatAgendaTabView,
    };
});
