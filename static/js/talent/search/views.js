define([
    'jquery',
    'underscore',
    'core/view',
    'text!talent/search/templates/search.html',
    'text!talent/search/templates/user.html'
], function(
    $,
    _,
    view,
    search_template,
    user_template) {
    
    /**
     * Talent search user view.
     * @constructor
     * @param {Object} options
     *   model: User model (required)
     */
    var SearchUserView = view.View.extend({

        tagName: 'li',

        initialize: function() {
            this.template = _.template(user_template);
        },

        
        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    
    /**
     * Talent user list view.
     * @constructor
     * @param {Object} options
     *   collection: UserCollection (required)
     */
    var SearchUserListView = view.View.extend({

        tagName: 'ul',
        
        initialize: function() {
            this.collection.bind('loaded', this.loaded, this);
            this.collection.bind('reset', this.render, this);
            this.collection.bind('add', this.added, this);
            this.childViews = [];

            if(!this.collection.isLoading()) {
                this.load();
            }
        },

        loaded: function(instance) {
            if(instance === this.collection) {
                this.load();
            }
        },

        load: function() {
            if(!this.collection.isLoaded()) {
                this.collection.fetch();
            }
        },

        render: function() {
            _.each(this.childViews, function(view) {
                view.destroy();
            });

            this.childViews = [];
            this.collection.each(this.added, this);
            return this;
        },
        
        added: function(model) {
            var view = new SearchUserView({
                model: model
            }).render();

            this.childViews.push(view);
            this.$el.append(view.el);
        }
    });

    /**
     * Search View Events
     */
    var EVENTS = {
    };

    /**
     * Talent search view.
     * @constructor
     * @param {Object} options
     *   collection: {UserCollection} (required)
     */
    var SearchView = view.View.extend({

        events: {
        },

        listSelector: 'ul',

        childViews: function() {
            return [this.userListView];
        },

        initialize: function() {
            this.template =  _.template(search_template);
            
            if(!this.collection.isLoading()) {
                this.load();
            }

            //child views
            this.userListView = null;

            if(!this.collection.isLoading()) {
                this.load();
            }
        },

        loaded: function(instance) {
            if(instance === this.collection) {
                this.load();
            }
        },

        load: function() {
            if(!this.collection.isLoaded()) {
                this.collection.fetch();
            }
        },

        render: function() {
            _.each(this.childViews, function(view) {
                view.destroy();
            });

            this.$el.html(this.template());

            this.userListView = new SearchUserListView({
                el: this.$(this.listSelector),
                collection: this.collection
            }).render();

            return this;
        }
    });

    return {
        EVENTS: EVENTS,
        SearchView: SearchView
    };
});
