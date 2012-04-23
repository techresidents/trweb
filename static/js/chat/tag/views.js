define([
    'jQuery',
    'Underscore',
    'Backbone',
    'chat/tag/models',
    'lookup/views',
], function($, _, Backbone, models, lookup, user) {


    var ChatTaggerItemView = Backbone.View.extend({

            tagName: 'li',

            template: _.template($("#tagger-item-template").html()),

            events: {
                "click .destroy": "destroy",
            },

            initialize: function() {
                this.model.bind("destroy", this.remove, this);
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
                this.collection.bind("reset", this.render, this);
                this.collection.bind("add", this.added, this);
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

            events: {
                "click .add": "addTag",
            },

            initialize: function() {
                this.tagInput = this.$('input');

                this.lookupView = new lookup.LookupView({
                    el: this.tagInput,
                    scope: "tag",
                    forceSelection: false,
                    onenter: this.updateOnEnter,
                    context: this
                });

            },

            render: function() {
                new ChatTaggerListView({
                        el: this.$('ul'),
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

            template: _.template($("#tag-item-template").html()),

            events: {
                "click .destroy": "destroy",
            },

            initialize: function() {
                this.model.bind("destroy", this.remove, this);
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
                view = new ChatTagItemView({model: model}).render();
                view.$el.fadeTo(1000, 1);
                this.$el.prepend(view.el);
            }
    });

    
    var ChatTagTabView = Backbone.View.extend({

            initialize: function() {
            },

            render: function() {
                new ChatTagListView({
                        el: this.$('ul'),
                        collection: models.tagCollection
                }).render();
            },
    });


    return {
        ChatTagTabView: ChatTagTabView,
        ChatTaggerView: ChatTaggerView,
    }
});
