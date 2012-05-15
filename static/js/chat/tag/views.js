define([
    'jQuery',
    'Underscore',
    'Backbone',
    'chat/tag/models',
    'chat/minute/models',
    'chat/agenda/models',
    'lookup/views',
], function($, _, Backbone, models, minute, agenda, lookup, user) {


    /**
     * Chat tagger list item view.
     * @constructor
     * @param {Object} options
     *   model: Tag model (required)
     *   templateSelector: html template selector (optional)
     */
    var ChatTaggerItemView = Backbone.View.extend({

        tagName: 'li',

        templateSelector: '#tagger-item-template',

        events: {
            'click .destroy': 'destroy',
        },

        initialize: function() {
            this.templateSelector = this.options.templateSelector || this.templateSelector;
            this.template = _.template($(this.templateSelector).html());
            this.model.bind('destroy', this.remove, this);
        },

        
        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            this.$('[rel=tooltip]').tooltip();
            return this;
        },

        destroy: function() {
            this.model.destroy();
        }
    });

    
    /**
     * Chat tagger list view.
     * @constructor
     * @param {Object} options
     *   collection: TagCollection (required)
     */
    var ChatTaggerListView = Backbone.View.extend({

        tagName: 'ul',
        
        initialize: function() {
            this.collection.bind('reset', this.render, this);
            this.collection.bind('add', this.added, this);
        },

        render: function() {
            this.collection.each(this.added, this);
        },
        
        added: function(model) {
            view = new ChatTaggerItemView({model: model}).render();
            view.$el.fadeTo(1000, 1);
            this.$el.prepend(view.el);
        }
    });



    /**
     * Chat tagger view.
     * @constructor
     * @param {Object} options
     *   templateSelector: html template selector (optional)
     *   inputSelector: el input selector for LookupView (optional)
     *   listSelector: el selector for ChatTaggerListView (optional)
     */
    var ChatTaggerView = Backbone.View.extend({

        templateSelector: '#tagger-template',

        inputSelector: 'input',

        listSelector: 'ul',

        events: {
            'click .add': 'addTag',
        },

        initialize: function() {
            this.inputSelector = this.options.inputSelector || this.inputSelector;
            this.listSelector = this.options.listSelector || this.listSelector;
            this.templateSelector = this.options.templateSelector || this.templateSelector;
            this.template =  _.template($(this.templateSelector).html());

            this.tagInput = null;
        },

        render: function() {
            this.$el.html(this.template());

            this.tagInput = this.$(this.inputSelector);

            new lookup.LookupView({
                el: this.tagInput,
                scope: 'tag',
                property: 'value',
                forceSelection: false,
                onenter: this.updateOnEnter,
                context: this
            });

            new ChatTaggerListView({
                el: this.$(this.listSelector),
                collection: models.tagCollection
            }).render();
        },
        
        addTag: function() {
            var value = this.tagInput.val();
            var activeMinute = minute.minuteCollection.active();

            if(value && activeMinute) {
                var tag = new models.Tag({
                    name: value,
                    minuteId: activeMinute.id
                });
                tag.save();

                this.tagInput.val(null);
                this.tagInput.focus();

            } else {
                this.tagInput.focus();
            }
        },

        updateOnEnter: function(value, data) {
            this.addTag();
        }
    });

    /**
     * Chat tag list item view.
     * @constructor
     * @param {Object} options
     *   model: Tag model (required)
     *   templateSelector: html template selector (optional)
     */
    var ChatTagItemView = Backbone.View.extend({

        tagName: 'li',

        templateSelector: '#tag-item-template',

        events: {
            'click .destroy': 'destroy',
        },

        initialize: function() {
            this.templateSelector = this.options.templateSelector || this.templateSelector;
            this.template = _.template($(this.templateSelector).html());
            this.model.bind('destroy', this.remove, this);
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },

        destroy: function() {
            this.model.destroy();
        }
    });

    /**
     * Chat tag list view.
     * @constructor
     * @param {Object} options
     *   collection: TagCollection (required)
     *   filter: callback method to filter displayed
     *      tags. Method will receive the Tag object
     *      as its sole parameter and should return
     *      a boolean indicated whether the tag
     *      should be displayed (optional)
     *   context: callback context (optional)
     */
    var ChatTagListView = Backbone.View.extend({

        tagName: 'ul',
        
        initialize: function() {
            this.filter = this.options.filter || this._passThroughFilter;
            this.context = this.options.context || this;
            this.collection.bind("reset", this.render, this);
            this.collection.bind("add", this.added, this);
            this.itemViews = [];
        },

        render: function() {
            this.$el.empty();
            this.collection.each(this.added, this);
            return this;
        },
        
        added: function(model) {
            var view = new ChatTagItemView({model: model}).render();
            view.$el.fadeTo(1000, 1);
            view.$el.toggle(this.filter.call(this.context, model));
            this.$el.prepend(view.el);
            this.itemViews.push(view);
        },

        applyFilter: function() {
            var that=this;
            _.each(this.itemViews, function(view) {
                view.$el.toggle(that.filter.call(that.context, view.model));
            });
        },

        _passThroughFilter: function(tag) {
            return true;
        },
    });

    /**
     * Chat tag topic select view.
     * @constructor
     * @param {Object} options
     *   model: Agenda (required)
     *   onChange: callback method to be invoked
     *      when topic selection changes. Method
     *      will be invoked with the selected Topic
     *      object as the sole parameter. (optional)
     *   context: callback context (optional)
     */
    var ChatTagTopicSelectView = Backbone.View.extend({

        tagName: 'select',

        templateSelector: '#tag-topic-select-template',

        events: {
            'change': 'changed',
        },
        
        initialize: function() {
            this.templateSelector = this.options.templateSelector || this.templateSelector;
            this.template = _.template($(this.templateSelector).html());
            this.onChange = this.options.onChange;
            this.context = this.options.context;
        },

        render: function() {
            this.$el.html(this.template({'topics': this.model.topics().toJSON()}));
            return this;
        },

        changed: function(e) {
            var topicId = e.currentTarget.value;
            var topic = this.model.topics().get(topicId);
            if(this.onChange) {
                this.onChange.call(this.context, topic);
            }
        },
    });


    /**
     * Chat tag tab view.
     * @constructor
     * @param {Object} options
     *   templateSelector: html template selector (optional)
     *   listSelector: el selector for ChatTagListView (optional)
     *   topicSelector: el selector for ChatTagTopicSelectView (optional)
     */
    var ChatTagTabView = Backbone.View.extend({

        listSelector: 'ul',

        topicSelector: 'select',

        initialize: function() {
            this.listSelector = this.options.listSelector || this.listSelector;
            this.topicSelector = this.options.topicSelector || this.topicSelector;
            this.selectedTopic = agenda.agenda.topics().first();
            this.listView = null;
            this.topicSelectView = null;
        },

        render: function() {
            this.topicSelectView = new ChatTagTopicSelectView({
                el: this.$(this.topicSelector),
                model: agenda.agenda,
                onChange: this.topicChanged,
                context: this,
            }).render();

            this.listView = new ChatTagListView({
                el: this.$(this.listSelector),
                collection: models.tagCollection,
                filter: this.listViewTagFilter,
                context: this,
            }).render();
        },

        topicChanged: function(topic) {
            //reapply list filter with updated selected topic
            this.selectedTopic = topic;
            this.listView.applyFilter();
        },

        listViewTagFilter: function(tag) {
            var result = false;

            var tagMinute = minute.minuteCollection.get(tag.minuteId());
            var tagTopic = agenda.agenda.topics().get(tagMinute.topicId());
            console.log(tagTopic);
            
            var topic = tagTopic;
            while(topic) {
                if(topic.id === this.selectedTopic.id) {
                    result = true;
                    break;
                }
                topic = agenda.agenda.topics().get(topic.parentId());
            }

            return result;
        },
    });


    return {
        ChatTagTabView: ChatTagTabView,
        ChatTaggerView: ChatTaggerView,
    }
});
