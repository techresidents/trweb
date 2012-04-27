define([
    'jQuery',
    'Underscore',
    'Backbone',
    'chat/tag/models',
    'lookup/views',
], function($, _, Backbone, models, lookup, user) {


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

            if(value) {
                var tag = new models.Tag({
                        name: value
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
     */
    var ChatTagListView = Backbone.View.extend({

        tagName: 'ul',
        
        initialize: function() {
            this.collection.bind("reset", this.render, this);
            this.collection.bind("add", this.added, this);
        },

        render: function() {
            this.collection.each(this.added, this);
        },
        
        added: function(model) {
            var view = new ChatTagItemView({model: model}).render();
            view.$el.fadeTo(1000, 1);
            this.$el.prepend(view.el);
        }
    });


    /**
     * Chat tag tab view.
     * @constructor
     * @param {Object} options
     *   templateSelector: html template selector (optional)
     *   listSelector: el selector for ChatTagListView (optional)
     */
    var ChatTagTabView = Backbone.View.extend({

        listSelector: 'ul',

        initialize: function() {
            this.listSelector = this.options.listSelector || this.listSelector;
        },

        render: function() {
            new ChatTagListView({
                el: this.$(this.listSelector),
                collection: models.tagCollection
            }).render();
        },
    });


    return {
        ChatTagTabView: ChatTagTabView,
        ChatTaggerView: ChatTaggerView,
    }
});
