define([
    'jquery',
    'underscore',
    'core/view',
    'api/loader',
    'ui/facet/views',
    'text!talent/search/templates/search.html',
    'text!talent/search/templates/user.html'
], function(
    $,
    _,
    view,
    api_loader,
    facet_views,
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
            //bind events
            this.listenTo(this.collection, 'reset', this.onReset);
            this.listenTo(this.collection, 'add', this.onAdd);

            this.loader = new api_loader.ApiLoader([
                { instance: this.collection }
            ]);
            this.loader.load();
            
            //child views
            this.childViews = [];
            this.initChildViews();
        },

        initChildViews: function() {
            this.destroyChildViews();
            this.childViews = [];
            this.collection.each(this.createChildView, this);
        },

        createChildView: function(model) {
            var view = new SearchUserView({
                model: model
            }).render();
            this.childViews.push(view);
            return view;
        },

        render: function() {
            _.each(this.childViews, function(view) {
                this.append(view);
            }, this);
            return this;
        },

        onReset: function() {
            this.initChildViews();
            this.render();
        },

        onAdd: function(model) {
            var view = this.createChildView(model);
            this.append(view);
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
     *   query: {ApiQuery} query (required)
     */
    var SearchView = view.View.extend({

        events: {
        },

        listSelector: 'ul',

        childViews: function() {
            return [this.userListView];
        },

        initChildViews: function() {
            /*
            this.userListView = new SearchUserListView({
                el: this.$(this.listSelector),
                collection: this.collection
            });
            */
            
            var config = {
                facets: [
                    { name: 'f_skills', title: 'Skills'},
                    { name: 'f_location_prefs', title: 'Location Preferences'}
                ]
            };
            this.facetsView = new facet_views.FacetsView({
                config: config,
                collection: this.collection.getFacets(),
                query: this.query,
                includeAll: true
            });
        },

        initialize: function(options) {
            this.template =  _.template(search_template);
            this.collection = options.collection;
            this.query = options.query;
            this.query.fetch();

            //child views
            this.userListView = null;
            this.initChildViews();
        },

        render: function() {
            this.$el.html(this.template());
            //this.assign(this.userListView, this.listSelector);
            this.append(this.facetsView, '.search-facets');
            return this;
        }
    });

    return {
        EVENTS: EVENTS,
        SearchView: SearchView
    };
});
