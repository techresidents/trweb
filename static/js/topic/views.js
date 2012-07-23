define([
    'jQuery',
    'Underscore',
    'Backbone',
    'topic/models'
], function($, _, Backbone, models) {

    var TopicView = Backbone.View.extend({
        tagName: 'li',

        template: _.template($('#topic-template').html()),

        events: {
            'click': 'clicked',
            'click .toggle-expanded': 'toggleExpanded'
        },

        initialize: function() {
            this.model = this.options.model;
            this.topicCollection = this.options.topicCollection;

            this.model.bind('change', this.render, this);
            this.model.bind('destroy', this.destroy, this);
        },
        
        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },

        destroy: function() {
        },

        clicked: function() {
            this.topicCollection.select(this.model.id);
        },

        toggleExpanded: function() {
            var expanded = this.model.get('expanded');
            this.model.set({expanded: !expanded});
        }
    });

    var TopicButtonsView = Backbone.View.extend({
        el: $('#topic-buttons'),

        editButton: $('#topic-edit-button'),

        removeButton: $('#topic-remove-button'),

        upButton: $('#topic-up-button'),

        downButton: $('#topic-down-button'),

        leftButton: $('#topic-left-button'),

        rightButton: $('#topic-right-button'),

        events: {
            'click #topic-remove-button' : 'remove',
            'click #topic-up-button' : 'shiftUp',
            'click #topic-down-button' : 'shiftDown',
            'click #topic-left-button' : 'shiftLeft',
            'click #topic-right-button' : 'shiftRight'
        },

        initialize: function() {
            this.topicCollection = this.options.topicCollection;
            this.topicCollection.bind('change:selection', this.selectedChanged, this);

            this.render();
        },

        render: function() {
            var topic = this.topicCollection.selected();

            if(topic) {
                this.enableAll();
                this.updateButton(this.upButton, this.topicCollection.isShiftUpAllowed(topic.id));
                this.updateButton(this.downButton, this.topicCollection.isShiftDownAllowed(topic.id));
                this.updateButton(this.leftButton, this.topicCollection.isShiftLeftAllowed(topic.id));
                this.updateButton(this.rightButton, this.topicCollection.isShiftRightAllowed(topic.id));

            } else {
                this.disableAll();
            }
        },

        selectedChanged: function() {
            this.render();
        },

        disableAll: function() {
            this.$('a').addClass('disabled');
        },

        enableAll: function() {
            this.$('a').removeClass('disabled');
        },

        updateButton: function(button, enable) {
            if(enable === true) {
                button.removeClass('disabled');
            } else {
                button.addClass('disabled');
            }
        },

        remove: function() {
            var topic = this.topicCollection.selected();
            this.topicCollection.remove(topic);
        },

        shiftUp: function() {
            var topic = this.topicCollection.selected();
            if(this.topicCollection.isShiftUpAllowed(topic.id)) {
                this.topicCollection.shiftUp(topic.id);
                this.topicCollection.select(topic.id);
            }
        },

        shiftDown: function() {
            var topic = this.topicCollection.selected();
            if(this.topicCollection.isShiftDownAllowed(topic.id)) {
                this.topicCollection.shiftDown(topic.id);
                this.topicCollection.select(topic.id);
            }
        },

        shiftLeft: function() {
            var topic = this.topicCollection.selected();
            if(this.topicCollection.isShiftLeftAllowed(topic.id)) {
                this.topicCollection.shiftLeft(topic.id);
                this.topicCollection.select(topic.id);
            }
        },

        shiftRight: function() {
            var topic = this.topicCollection.selected();
            if(this.topicCollection.isShiftRightAllowed(topic.id)) {
                this.topicCollection.shiftRight(topic.id);
                this.topicCollection.select(topic.id);
            }
        }
    });
    
    var TopicListView = Backbone.View.extend({

        el: $('#topic-list'),

        includeRoot: false,

        initialize: function() {
            this.topicCollection = this.options.topicCollection;
            this.topicCollection.bind('reset', this.render, this);
            this.topicCollection.bind('remove', this.remove, this);
            this.topicCollection.bind('add', this.addTopicView, this);
        },

        render: function() {
            this.$el.children().remove();
            this.topicCollection.each(this.addTopicView, this);
        },

        remove: function() {
            this.render();
            this.topicCollection.select(-1);
        },

        addTopicView: function(topic) {
            if(this.includeRoot || topic.get('rank') !== 0) {
            
                var view = new TopicView({
                        model: topic,
                        topicCollection: this.topicCollection
                });

                this.$el.append(view.render().el);
            }
        }
    });

    var TopicAddView = Backbone.View.extend({

        el: $('#topic-add'),
        topicTitleSelector: $('#topic-input'),
        topicDescriptionSelector: $('#topic-description-input'),
        topicDurationSelector: $('#topic-duration-input'),

        events: {
            'click button': 'addTopic',
            'keypress #topic-input': 'updateOnEnter'
        },

        initialize: function() {
            this.topicCollection = this.options.topicCollection;
            this.topicTitleInput = this.$(this.topicTitleSelector);
            this.topicDescriptionInput = this.$(this.topicDescriptionSelector);
            this.topicDurationInput = this.$(this.topicDurationSelector);
        },

        addTopic: function() {
            var title = this.topicTitleInput.val();
            var description = this.topicDescriptionInput.val();
            var duration = this.topicDurationSelector.val();
            
            if(title) {
                var topic = new models.Topic({
                        parentId: 0,
                        title: title,
                        description: description,
                        duration: duration,
                        rank: this.topicCollection.length,
                        expanded: true
                });

                this.topicCollection.add(topic);

                this.topicTitleInput.val('');
                this.topicDescriptionInput.val('');
                this.topicDurationInput.val(5);
                this.topicTitleInput.focus();
            } else {
                this.topicTitleInput.focus();
            }

        },

        updateOnEnter: function(e) {
            if(e.keyCode === 13) {
                this.addTopic();
            }
        }
    });

    var TopicFormView = Backbone.View.extend({

        el: $('#topic-form'),

        initialize: function() {
            this.topicCollection = this.options.topicCollection;
            this.topicCollection.bind('add', this.change, this);
            this.topicCollection.bind('reset', this.change, this);
            this.topicCollection.bind('remove', this.change, this);
            this.topicCollection.bind('change', this.change, this);

            this.topicsFormInput = this.$('#topic-form-input');
        },

        change: function() {
            this.topicsFormInput.val(JSON.stringify(this.topicCollection.toJSON()));
        }
    });

    return {
        TopicAddView: TopicAddView,
        TopicButtonsView: TopicButtonsView,
        TopicFormView: TopicFormView,
        TopicListView: TopicListView,
        TopicView: TopicView
    };
});
