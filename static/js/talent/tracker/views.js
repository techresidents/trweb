define([
    'jquery',
    'underscore',
    'core/factory',
    'core/view',
    'ui/ac/matcher',
    'ui/ac/views',
    'ui/paginator/views',
    'talent/tracker/grid',
    'talent/tracker/filter',
    'text!talent/tracker/templates/tracker.html'
], function(
    $,
    _,
    factory,
    view,
    ac_matcher,
    ac_views,
    paginator_views,
    tracker_grid,
    tracker_filter,
    tracker_template) {

    /**
     * Tracker view.
     * @constructor
     * @param {Object} options
     *   collection: {ApplicationCollection} collection (required)
     *   query: {ApiQuery} query (required)
     */
    var TrackerView = view.View.extend({
            
        events: {
        },

        initialize: function(options) {
            this.template =  _.template(tracker_template);
            this.collection = options.collection;
            this.query = options.query.withRelated('requisition');
            this.query.fetch();

            //child views
            this.filtersView = null;
            this.gridView = null;
            this.paginatorView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [this.filtersView, this.gridView, this.paginatorView];
        },

        initChildViews: function() {
            this.matcher = new ac_matcher.CollectionMatcher({
                collection: this.collection,
                stringify: function(model) {
                    return model.get_requisition().get_title() + ' (' + model.id + ')';
                }
            });
            this.macView = new ac_views.MultiAutoCompleteView({
                collection: this.collection.clone(),
                matcher: this.matcher
            });
            this.filtersView = new tracker_filter.TrackerFiltersView({
                collection: this.collection,
                query: this.query,
                horizontal: true
            });

            this.gridView = new tracker_grid.TrackerGridView({
                collection: this.collection,
                query: this.query
            });

            this.paginatorView = new paginator_views.PaginatorView({
                maxPages: 10,
                collection: this.collection,
                query: this.query
            });
        },

        
        render: function() {
            this.$el.html(this.template());
            this.append(this.filtersView, '.content');
            this.append(this.macView, '.content');
            this.append(this.gridView, '.content');
            this.append(this.paginatorView, '.content');
            return this;
        }
    });

    return {
        TrackerView: TrackerView
    };
});
