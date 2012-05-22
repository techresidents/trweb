define([
    'jQuery',
    'Underscore',
    'Backbone',
    'chat/tag/models',
    'chat/minute/models',
    'chat/agenda/models',
    'chat/user/models',
    'lookup/views',
    'text!chat/tag/templates/tag_tab.html',
    'text!chat/tag/templates/tag_item.html',
    'text!chat/tag/templates/tagger.html',
    'text!chat/tag/templates/tagger_item.html',
    'text!chat/tag/templates/tag_topic_select.html',
], function(
    $,
    _,
    Backbone,
    models,
    minute,
    agenda,
    user,
    lookup,
    tag_tab_template,
    tag_item_template,
    tagger_template,
    tagger_item_template,
    tag_topic_select_template) {

    /**
     * Chat tagger list item view.
     * @constructor
     * @param {Object} options
     *   model: Tag model (required)
     */
    var ChatTaggerItemView = Backbone.View.extend({

        tagName: 'li',

        events: {
            'click .destroy': 'destroy',
        },

        initialize: function() {
            this.template = _.template(tagger_item_template);
            this.model.bind('destroy', this.remove, this);
        },

        
        render: function() {
            var timestamp = this.model.header.timestamp_as_date();
            var json = _.extend(this.model.toJSON(), {
                user: user.users.get(this.model.userId()).toJSON(),
                time: timestamp.getHours() + ':' + timestamp.getMinutes()
            });
            this.$el.html(this.template(json));
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
     *   filter: callback method to filter displayed
     *      tags. Method will receive the Tag object
     *      as its sole parameter and should return
     *      a boolean indicated whether the tag
     *      should be displayed (optional)
     *   context: callback context (optional)
     */
    var ChatTaggerListView = Backbone.View.extend({

        tagName: 'ul',
        
        initialize: function() {
            this.filter = this.options.filter || this._passThroughFilter;
            this.context = this.options.context || this;
            this.collection.bind('reset', this.render, this);
            this.collection.bind('add', this.added, this);
            this.itemViews = [];
        },

        render: function() {
            this.collection.each(this.added, this);
            return this;
        },
        
        added: function(model) {
            view = new ChatTaggerItemView({model: model}).render();
            view.$el.fadeTo(1000, 1);
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
     * Chat tagger view.
     * @constructor
     * @param {Object} options
     */
    var ChatTaggerView = Backbone.View.extend({

        inputSelector: 'input',

        listSelector: 'ul',

        events: {
            'click .add': 'addTag',
        },

        initialize: function() {
            this.template =  _.template(tagger_template);
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
     */
    var ChatTagItemView = Backbone.View.extend({

        tagName: 'li',

        events: {
            'click .destroy': 'destroy',
        },

        initialize: function() {
            this.template = _.template(tag_item_template);
            this.model.bind('destroy', this.remove, this);
        },

        render: function() {
            var timestamp = this.model.header.timestamp_as_date();
            var json = _.extend(this.model.toJSON(), {
                user: user.users.get(this.model.userId()).toJSON(),
                time: timestamp.getHours() + ':' + timestamp.getMinutes()
            });
            this.$el.html(this.template(json));
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

        events: {
            'change': 'changed',
        },
        
        initialize: function() {
            this.template = _.template(tag_topic_select_template);
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
     *   listSelector: el selector for ChatTagListView (optional)
     *   topicSelector: el selector for ChatTagTopicSelectView (optional)
     */
    var ChatTagTabView = Backbone.View.extend({

        listSelector: 'ul',

        topicSelector: 'select',

        initialize: function() {
            this.template = _.template(tag_tab_template);
            this.selectedTopic = agenda.agenda.topics().first();
            this.listView = null;
            this.topicSelectView = null;
        },

        render: function() {
            this.$el.html(this.template());

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
        ChatTaggerListView: ChatTaggerListView,
        ChatTagListView: ChatTagListView,
    }
});
