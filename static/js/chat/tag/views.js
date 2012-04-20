define([
    'jQuery',
    'Underscore',
    'Backbone',
    'chat/tag/models',
    'lookup/views',
], function($, _, Backbone, models, lookup, user) {


    var ChatTagItemView = Backbone.View.extend({

            tagName: "li",

            template: _.template($("#tag-item-template").html()),

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

    
    var ChatTagView = Backbone.View.extend({

            events: {
                "click button": "addTag",
            },

            initialize: function() {
                models.tagCollection.bind("add", this.added, this);
                
                this.tagInput = this.$("input");
                this.tagList = this.$("ul");
                
                this.lookupView = new lookup.LookupView({
                    el: this.tagInput,
                    scope: "tag",
                    forceSelection: false,
                    onenter: this.updateOnEnter,
                    context: this
                });

            },
            
            added: function(model) {
                view = new ChatTagItemView({model: model}).render();
                view.$el.fadeTo(1000, 1);
                this.tagList.prepend(view.el);
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


    var ChatTagTabView = Backbone.View.extend({

            initialize: function() {
                models.tagCollection.bind("add", this.added, this);
                this.tagList = this.$("ul");
            },
            
            added: function(model) {
                this.tagList.append(new ChatTagItemView({model: model}).render().el);

                //scroll to bottom
                this.tagList.animate({scrollTop: 1000}, 800);
            },
    });


    return {
        ChatTagTabView: ChatTagTabView,
        ChatTagView: ChatTagView,
        ChatTagItemView: ChatTagItemView,
    }
});
