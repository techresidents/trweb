define([
    'jquery',
    'underscore',
    'core/base',
    'api/fetcher'
], function(
    $,
    _,
    base,
    api_fetcher) {

    /**
     * ApiLoader
     * @constructor
     * @param {Object} options
     */
    var ApiLoader = base.Base.extend({
        
        initialize: function(targets, options) {
            this.targets = targets || [];
        },

        load: function(options) {
            options = options || {};
            var targets = this.targets;
            var queries = [], loading = [];
            var count = 0, loaded = 0;

            var loadedCallback = function(target, instance) {
                if(target.instance === instance) {
                    target.instance.off('loaded', target.loadedCallback);
                    loaded += 1;

                    if(loaded >= count) {
                        this.load(targets, options);
                    }
                }
            };
           
            _.each(targets, function(target) {
                if(target.instance.isLoading()) {
                    loading.push(target);
                }
                
            }, this);
            
            if(loading.length) {
                count = loading.length;
                _.each(loading, function(target) {
                    target.loadedCallback = _.bind(loadedCallback, this, target);
                    target.instance.on('loaded', target.loadedCallback, this);
                }, this);

            } else {
                _.each(targets, function(target) {
                    var instance = target.instance;
                    var withRelated  = target.withRelated;
                    var state = instance.isLoadedWith.apply(instance, withRelated);
                    if(!state.loaded && target.instance.isLoadable()) {
                        queries = queries.concat(state.fetcher.queries);
                    }
                }, this);

                var fetcher = new api_fetcher.ApiFetcher(queries);
                fetcher.fetch({
                    success: options.success,
                    error: options.error
                });
            }
        }
    });

    return {
        ApiLoader: ApiLoader
    };
});
