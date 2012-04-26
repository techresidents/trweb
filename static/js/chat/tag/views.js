define([
    'jQuery',
    'Underscore',
    'Backbone',
    'chat/tag/models',
    'lookup/views',
], function($, _, Backbone, models, lookup, user) {


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

        updateOnEnter: function(value) {
            this.addTag();
        }
    });

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
