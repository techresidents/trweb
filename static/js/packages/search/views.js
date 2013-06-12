define([
    'jquery',
    'underscore',
    'core',
    'api',
    'ui',
    'text!./templates/search.html',
    'text!./templates/user.html'
], function(
    $,
    _,
    core,
    api,
    ui,
    search_template,
    user_template) {
    
    /**
     * Search View Events
     */
    var EVENTS = {
    };

    /**
     * Talent search user view.
     * @constructor
     * @param {object} options
     * @param {UserSearch} options.model UserSearch model
     */
    var SearchUserView = core.view.View.extend({

        initialize: function() {
            this.template = _.template(user_template);
        },

        classes: function() {
            return ['search-user'];
        },

        render: function() {
            this.sort();
            this.$el.html(this.template(this.model.toJSON()));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        },

        sort: function() {
            if(!this.model.get_skills()) {
                return;
            }

            var skills = _.sortBy(this.model.get_skills(), function(skill) {
                var expertise = 1;
                var yrs_experience = skill.yrs_experience || 1;
                switch(skill.expertise_type) {
                    case 'Proficient':
                        expertise = 2;
                        break;
                    case 'Expert':
                        expertise = 3;
                        break;
                }
                return -1 * (expertise*100 + yrs_experience);
            });
            
            var args = [0, skills.length].concat(skills);
            Array.prototype.splice.apply(this.model.get_skills(), args);
        }
    });


    /**
     * Talent search facets view.
     * @constructor
     * @param {object} options
     * @param {UserSearchCollection} options.collection User Search collection
     * @param {ApiQuery} options.query UserSearchCollection query
     */
    var SearchFacetsView = ui.facet.views.FacetsView.extend({
        initialize: function(options) {
            var matcher = new ui.ac.matcher.QueryMatcher({
                queryFactory: new core.factory.FunctionFactory(function(options) {
                    var query = new api.models.TechnologySearchCollection();
                    query = query.filterBy({
                        ac: options.search
                    }).slice(0, options.maxResults);
                    return query;
                }),
                stringify: function(technology) {
                    return technology.get_name();
                }
            });

            var config = {
                facets: [
                    {
                        name: 'f_skills',
                        facetView: new ui.facet.views.AutoFacetView.Factory({
                            matcher: matcher })
                    },
                    { name: 'f_location_prefs', open: false},
                    { name: 'f_yrs_experience', open: false},
                    {
                        name: 'f_technology_prefs',
                        facetView: new ui.facet.views.AutoFacetView.Factory({
                            matcher: matcher }),
                        open: false
                    },
                    { name: 'f_position_prefs', open: false},
                    { name: 'f_joined', open: false}
                ]
            };

            options = _.extend({
                config: config
            }, options);

            ui.facet.views.FacetsView.prototype.initialize.call(this, options);
        }
    });

    /**
     * Talent search view.
     * @constructor
     * @param {object} options
     * @param {UserSearchCollection options.collection UserSearchCollection
     * @param {ApiQuery} options.query UserSearchCollection query
     */
    var SearchView = core.view.View.extend({

        events: {
            'enterkey .search-bar': 'onEnterKey',
            'click .search-button': 'onClick'
        },

        initialize: function(options) {
            this.template =  _.template(search_template);
            this.collection = options.collection;
            this.query = options.query;
            this.query.fetch();
            
            //bind events
            this.listenTo(this.collection, 'reset', this.onReset);

            //child views
            this.facetsView = null;
            this.usersView = null;
            this.inputHandlerView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [
                this.facetsView,
                this.inputHandlerView,
                this.usersView,
                this.paginatorView];
        },

        initChildViews: function() {
            this.facetsView = new SearchFacetsView({
                collection: this.collection.getFacets(),
                query: this.query
            });

            this.inputHandlerView = new ui.input.views.InputHandlerView({
                inputView: this,
                inputSelector: '.search-input'
            });
            var filter = _.first(this.query.state.filters().getFilters('q'));
            if(filter) {
                this.inputHandlerView.setInputValue(filter.value());
            }

            this.usersView = new ui.collection.views.ListView({
                collection: this.collection,
                query: this.query,
                viewFactory: new core.factory.Factory(SearchUserView, {})
            });


            this.paginatorView = new ui.paginator.views.PaginatorView({
                maxPages: 10,
                collection: this.collection,
                query: this.query
            });
        },

        render: function() {
            this.$el.html(this.template());
            this.append(this.facetsView, '.search-facets');
            this.append(this.inputHandlerView, '.search-bar');
            this.append(this.usersView, '.search-container');
            this.append(this.paginatorView, '.search-container');
            return this;
        },

        search: function(q) {
            var pageSize = 20;
            var slice = this.query.state.slice();
            if(slice) {
                pageSize = slice.end() - slice.start();
            }
            this.query.filterBy({
                q: q
            }).slice(0, pageSize).fetch();
        },

        onReset: function() {
            $('html,body').scrollTop(0);
        },

        onEnterKey: function(e) {
            var q = this.inputHandlerView.getInputValue();
            this.search(q);
        },

        onClick: function(e) {
            var q = this.inputHandlerView.getInputValue();
            this.search(q);
        }

    });

    return {
        EVENTS: EVENTS,
        SearchView: SearchView
    };
});
