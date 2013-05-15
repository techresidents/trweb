define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    './fetcher'
], function(
    $,
    _,
    Backbone,
    core,
    api_fetcher) {

    /**
     * ApiLoader
     * @constructor
     * @param {Object} options
     */
    var ApiLoader = core.base.Base.extend({
        
        initialize: function(targets, options) {
            options = _.extend({
                triggerAlways: false
            }, options);

            this.targets = targets || [];
            this.triggerAlways = options.triggerAlways;
            this.loaded = false;
            this.loading = false;
        },

        isLoading: function() {
            return this.loading;
        },

        isLoaded: function() {
            var result = false;
            
            //this.loaded will not be set to true until after target events
            //(reset, change, etc...) have fired. Since views react to
            //these events and will check with the loader to see
            //if its loaded we need to check each target individually
            //to determine if things have loaded if this.loaded is false.
            if(this.loaded) {
                result = true;
            } else {
                //check if some targets are not loaded as optimization
                result = !_.some(this.targets, function(target) {
                    var instance = target.instance;
                    var withRelated  = target.withRelated;
                    var state = instance.isLoadedWith.apply(instance, withRelated);
                    return !state.loaded;
                    }, this);
            }
            return result;
        },

        load: function(options) {
            options = _.extend({
                triggerAlways: this.triggerAlways
            }, options);

            var targets = this.targets;
            var fetcher, queries = [], loading = [];
            var count = 0, loaded = 0;
            
            //callback to be invoked when a target which was
            ///already loading at the start of this call finishes loading
            var loadedCallback = function(target, instance) {
                if(target.instance === instance) {
                    target.instance.off('loaded', target.loadedCallback);
                    loaded += 1;

                    if(loaded >= count) {
                        this.load(options);
                    }
                }
            };
            
            //callback to be invoked by fetcher when all data is loaded
            var successCallback = function() {
                this.loading = false;
                this.loaded = true;
                this.trigger('loaded');
                if(options.success) {
                    options.success();
                }
            };
            

            //find targets which are already in process of loading
            _.each(targets, function(target) {
                if(target.instance.isLoading()) {
                    loading.push(target);
                }
                
            }, this);
            
            //if some targets are already in process of loading,
            //wait for them to finish loading and then invoke
            //load() again.
            if(loading.length) {
                count = loading.length;
                _.each(loading, function(target) {
                    target.loadedCallback = _.bind(loadedCallback, this, target);
                    target.instance.on('loaded', target.loadedCallback, this);
                }, this);

            } else {
                //determine queries we need to load all data
                _.each(targets, function(target) {
                    var instance = target.instance;
                    var withRelated  = target.withRelated;
                    var state = instance.isLoadedWith.apply(instance, withRelated);
                    if(!state.loaded && target.instance.isLoadable()) {
                        queries = queries.concat(state.fetcher.queries);
                    }
                }, this);
                
                if(queries.length) {
                    this.loading = true;
                    this.trigger('loading');
                    fetcher = new api_fetcher.ApiFetcher(queries);
                    fetcher.fetch({
                        success: _.bind(successCallback, this),
                        error: options.error
                    });
                } else {
                    this.loaded = true;
                    if(options.triggerAlways && options.success) {
                        this.trigger('loaded');
                        options.success();
                    }

                }
            }
        }
    });
    
    //add events mixin
    _.extend(ApiLoader.prototype, Backbone.Events);

    return {
        ApiLoader: ApiLoader
    };
});
