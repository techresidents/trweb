define([
    'jquery',
    'underscore',
    'core/factory',
    'api/models',
    'ui/ac/matcher',
    'ui/filter/views'
], function(
    $,
    _,
    factory,
    api,
    ac_matcher,
    filter_views) {

    /**
     * Tracker Filters View.
     * @constructor
     * @param {Object} options
     */
    var TrackerFiltersView = filter_views.FiltersView.extend({

        initialize: function(options) {
            options = _.extend({
                config: TrackerFiltersView.config()
            }, options);

            filter_views.FiltersView.prototype.initialize.call(this, options);
        },

        classes: function() {
            var result = filter_views.FiltersView.prototype.classes.call(this);
            result = result.concat(['tracker-filters']);
            return result;
        }
    }, {
        config: function() {
            var config = {
                filters: [
                    TrackerFiltersView.statusFilter(),
                    TrackerFiltersView.requisitionFilter(),
                    TrackerFiltersView.createdFilter()
                ]
            };
            return config;
        },

        statusFilter: function() {
            return {
                name: 'Status',
                field: 'status',
                filterView: new filter_views.SelectFilterView.Factory({
                    selections: [
                        'NEW', 'REVIEW', 'INTERVIEW_OFFER_PENDING',
                        'INTERVIEW_OFFER_ACCEPTED', 'INTERVIEW_OFFER_DECLINED',
                        'INTERVIEW_OFFER_RESCINDED', 'INTERVIEW_OFFER_EXPIRED',
                        'REJECTED']
                })
            };
        },

        requisitionFilter: function() {
            var createQuery = function(options) {
                return new api.RequisitionCollection().filterBy({
                    'title__istartswith': options.search
                });
                //return new api.RequisitionCollection().query();
            };

            var matcher = new ac_matcher.QueryMatcher({
                queryFactory: new factory.FunctionFactory(createQuery),
                stringify: function(model) {
                    return model.get_title();
                },
                map: function(model) {
                    return {
                        value: model.get_title()
                    };
                }
            });
        
            return {
                name: 'Requsition',
                field: 'requisition__title',
                filterView: new filter_views.AutoSelectFilterView.Factory({
                    inputPlaceholder: 'Requisition title',
                    matcher: matcher
                })
            };
        },

        createdFilter: function() {
            return {
                name: 'Created',
                field: 'created',
                filterView: new filter_views.DateRangeFilterView.Factory()
            };
        }
    });


    return {
        TrackerFiltersView: TrackerFiltersView
    };

});
