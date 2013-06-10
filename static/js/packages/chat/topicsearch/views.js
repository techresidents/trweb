define([
    'jquery',
    'underscore',
    'core',
    'api',
    'ui',
    'text!./templates/topicsearch_page.html',
    'text!./templates/topicsearch_result.html'
], function(
    $,
    _,
    core,
    api,
    ui,
    topicsearch_page_template,
    topicsearch_result_template) {

    /**
     * Topic search result view.
     * @constructor
     * @param {object} options
     * @param {TopicSearch} options.model TopicSearch model
     */
    var TopicSearchResultView = core.view.View.extend({

        initialize: function(options) {
            this.model = options.model;
            this.template = _.template(topicsearch_result_template);
        },

        classes: function() {
            return ['search-topic'];
        },

        render: function() {
            var durationText = '';
            var oneMinute = 60;
            if (this.model) {
                duration = parseInt(this.model.get_duration(), 10);
                if (duration < oneMinute) {
                    durationText = duration + ' secs';
                }
                if (duration === oneMinute) {
                    durationText = duration/oneMinute + ' min';
                }
                if (duration > oneMinute) {
                    durationText = parseInt(duration/oneMinute, 10) + ' mins';
                }
            }
            var context = {
                durationText: durationText,
                topic: this.model.toJSON()
            };
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        }
    });

    /**
     * Topic search facets view.
     * @constructor
     * @param {object} options
     * @param {TopicSearchCollection} options.collection Topic Search collection
     * @param {ApiQuery} options.query TopicSearchCollection query
     */
    var TopicSearchFacetsView = ui.facet.views.FacetsView.extend({
        initialize: function(options) {

            var config = {
                facets: [
                    { name: 'f_duration', open: true}
                ]
            };

            options = _.extend({
                config: config
            }, options);

            ui.facet.views.FacetsView.prototype.initialize.call(this, options);
        }
    });

    /**
     * Topic search page view.
     * @constructor
     * @param {object} options
     * @param {TopicSearchCollection} options.collection TopicSearchCollection
     * @param {ApiQuery} options.query TopicSearchCollection query
     */
    var TopicSearchPageView = core.view.View.extend({

        facetsSelector: '.topicsearch-facets',
        searchBarSelector: '.search-bar',
        searchResultsSelector: '.topicsearch-results-container',
        searchViewInputSelector: '.search-input',

        events: {
            'enterkey .search-bar': 'onEnterKey',
            'click .topicsearch-button': 'onClick'
        },

        initialize: function(options) {
            this.template =  _.template(topicsearch_page_template);
            this.collection = options.collection;
            this.query = options.query;
            this.query.fetch();

            //bind events
            this.listenTo(this.collection, 'reset', this.onReset);

            //child views
            this.facetsView = null;
            this.topicsCollectionView = null;
            this.inputHandlerView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [
                this.facetsView,
                this.inputHandlerView,
                this.topicsCollectionView,
                this.paginatorView];
        },

        initChildViews: function() {
            this.facetsView = new TopicSearchFacetsView({
                collection: this.collection.getFacets(),
                query: this.query
            });

            this.inputHandlerView = new ui.input.views.InputHandlerView({
                inputView: this,
                inputSelector: this.searchViewInputSelector
            });
            // Set the search input field to hold the user's search query
            var filter = _.first(this.query.state.filters().getFilters('q'));
            if (filter) {
                this.inputHandlerView.setInputValue(filter.value());
            }

            this.topicsCollectionView = new ui.collection.views.CollectionView({
                collection: this.collection,
                query: this.query,
                viewFactory: new core.factory.Factory(TopicSearchResultView, {}),
                sort: this._viewSort
            });


            this.paginatorView = new ui.paginator.views.PaginatorView({
                maxPages: 10,
                collection: this.collection,
                query: this.query
            });
        },

        classes: function() {
            return ['topicsearch'];
        },

        render: function() {
            this.$el.html(this.template());
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.facetsView, this.facetsSelector);
            this.append(this.inputHandlerView, this.searchBarSelector);
            this.append(this.topicsCollectionView, this.searchResultsSelector);
            this.append(this.paginatorView, this.searchResultsSelector);
            this._applySearchPlaceholderText(); // TODO discuss passing this option to InputViewHandler
            return this;
        },

        search: function(q) {
            var pageSize = 20;
            var slice = this.query.state.slice();
            if(slice) {
                pageSize = slice.end() - slice.start();
            }
            this.query
                .filterBy({q: q})
                .slice(0, pageSize)
                .fetch();
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
        },

        /**
         * viewSort
         * this.topicsCollectionView requires a sort function to be defined that the
         * underlying CollectionView will use to sort the views in the collection.
         * @param view
         * @returns {number}
         */
        _viewSort: function(view) {
            var ret = 0;
            if (view && view.model) {
                ret = view.model.get_title();
            }
            return ret;
        },

        _applySearchPlaceholderText: function() {
            this.$(this.searchViewInputSelector).attr('placeholder', 'Search chat topics');
        }
    });

    return {
        TopicSearchPageView: TopicSearchPageView
    };
});
