define([
    'jquery',
    'underscore',
    'backbone',
    'xd/xd',
    'xd/backbone'
], function($, _, Backbone, xd, xdBackbone) {

    /**
     * LookupResult encapsulates an autocomplete lookup result from lookupsvc.
     * This class is not typically instantiated directly. @see LookupCache.
     * @constructor
     * @param {Object} attributes Optional model attributes.
     *   scope: identifies which scope to use for the lookup, i.e. 'location', 'technology'.
     *   category: further refines the scope, i.e. 'zip', 'city'.
     *   query: lookup query string, i.e. 'san fran'
     *   timestamp: time in milliseconds when object was constructed.
     *   matches: array of match results which are scope/category specific.
     */
    var LookupResult = Backbone.Model.extend({
            
        idAttribute: 'query',

        defaults: function() {
            return {
                scope: '',
                category: null,
                query: '',
                timestamp: new Date().getTime(),
                matches: []
            };
        },

        scope: function() {
            return this.get('scope');
        },

        category: function() {
            return this.get('category');
        },

        query: function() {
            return this.get('query');
        },

        matches: function() {
            return this.get('matches');
        },

        timestamp: function() {
            return this.get('timestamp');
        },

        url: function() {
            if(this.category()) {
                return '/lookup/' + this.scope() + '/' + this.category();
            } else {
                return '/lookup/' + this.scope();
            }
        },

        //Use cross domain aware backbone sync function.
        sync: function(method, collection, options) {
            if(method === 'read') {
                var data = {
                    query: this.query()
                };

                options.data = data;
            }
            return xdBackbone.sync(method, collection, options);
        }
    });

    /**
     * LookupCache provides read-through cache for performing lookups via lookupsvc.
     * @constructor
     * @param {LookupResult[]} models: Optional LookupResult models to include in collection.
     * @param {Object} attributes collection options.
     *   scope: required scope to use for the lookup, i.e. 'location', 'technology'.
     *   category: optional scope refinement, i.e. 'zip', 'city'.
     *   cacheSize: max number of results to cache, defaults to 30.
     *   maxResults: max number of lookup results to return, defaults to 8.
     */
    var LookupCache = Backbone.Collection.extend({
        model: LookupResult,
        
        initialize: function(models, options) {
            this.scope = options.scope;
            this.category = options.category;
            this.cacheSize = options.cacheSize || 30;
            this.maxResults = options.maxResults || 8;
            this.lastResult = null;

            if(this.category) {
                this.url = '/lookup/' + this.scope + '/' + this.category;
            } else {
                this.url = '/lookup/' + this.scope;
            }

        },
        
        //Use cross domain aware backbone sync function.
        sync: xdBackbone.sync,
 
        //Sort LookupResult objects by timestamp, so we can remove the
        //oldest objects when cache is full.
        comparator: function(lookupResult) {
            return lookupResult.timestamp();
        },
        
        /**
         * Optimazation helper function to prevent sending queries to
         * lookupsvc if we can deduce the result from the previous result.
         * For instance, if the last result contains less than maxResults
         * matches, then there's no need to send additional queries if they
         * start with the same characters as the previous query.
         * @param {string} query lookup query.
         * @return {boolean} indicating if the given query is satisfied by
         *   the previous result.
         */ 
        lastResultSatisfies: function(query) {
            if(query &&
               query.length &&
               this.lastResult &&
               this.lastResult.query().length &&
               this.lastResult.matches().length < this.maxResults &&
               query.indexOf(this.lastResult.query()) === 0) {
                   return true;
           } else {
               return false;
           }
        },
        
        /**
         * Send a lookup query to lookupsvc and return the result via callback.
         * @param {string}  query lookup query.
         * @param {function} callback optional callback to invoke when the 
         *   result is available. If provided, the callback will be 
         *   invoked with (query, LookupResult) arguments.
         * @return {LookupResult} if a cached result is available which
         *   satisified the query. Otherwise nothing will be returned
         *   and the result will be returned via the specified callback.
         */
        lookup: function(query, callback) {

            result = this.get(query);

            if(result) {
                this.lookupComplete(query, result, callback);
            } else if(this.lastResultSatisfies(query)) {
                result = this.lastResult;
                this.lookupComplete(query, result, callback);
            } else {
                //fetch lookup results from lookupsvc
                var that = this;
                this.fetch({
                    add: true,
                    silent: false,
                    data: { query: query, maxResults: this.maxResults },
                    complete: function() {
                        that.lookupComplete.call(that, query, that.get(query), callback);
                    }
                });
            }
            return result;
        },
        
        /**
         * Processes a lookup result.
         * @param {string} query lookup query.
         * @param {LookupResult} result}.
         * @param {function} callback user supplied callback to be invoked.
         */
        lookupComplete: function(query, result, callback) {
            this.lastResult = result;

            if(this.length > this.cacheSize) {
                this.remove(this.at(0));
            }

            if(callback) {
                callback(query, result);
            }
        }
    });

    return {
        LookupResult: LookupResult,
        LookupCache: LookupCache
    };
});
