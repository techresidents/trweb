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
     */
    var TopicSearchPageView = core.view.View.extend({

        facetsSelector: '.topicsearch-facets',
        searchBarSelector: '.search-bar',
        searchResultsSelector: '.topicsearch-results-container',
        searchViewInputSelector: '.search-input',
        searchHelpSelector: '.topicsearch-help',

        events: {
            'enterkey .search-bar': 'onEnterKey',
            'click .topicsearch-button': 'onClick'
        },

        initialize: function(options) {
            this.template =  _.template(topicsearch_page_template);
            this.collection = options.collection;
            this.query = this.collection.query();
            this.collection.fetch();

            //bind events
            this.listenTo(this.collection, 'reset', this.onReset);

            //child views
            this.facetsView = null;
            this.topicsCollectionView = null;
            this.inputHandlerView = null;
            this.searchHelpView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [
                this.facetsView,
                this.inputHandlerView,
                this.topicsCollectionView,
                this.paginatorView,
                this.searchHelpView
            ];
        },

        initChildViews: function() {
            this.facetsView = new TopicSearchFacetsView({
                collection: this.collection
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
                viewFactory: new core.factory.Factory(TopicSearchResultView, {})
            });

            this.paginatorView = new ui.paginator.views.PaginatorView({
                maxPages: 10,
                collection: this.collection
            });

            this.searchHelpView = new ui.help.views.HelpView({
                help: '<p>Have a topic that you want to chat about? <a href="/feedback/" target="_blank">Request Chat Topic</a></p>',
                placement: 'bottom',
                iconClasses: 'icon-question-sign'
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
            this.append(this.searchHelpView, this.searchHelpSelector);
            this.append(this.topicsCollectionView, this.searchResultsSelector);
            this.append(this.paginatorView, this.searchResultsSelector);
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
        }
    });

    return {
        TopicSearchPageView: TopicSearchPageView
    };
});
