define(/** @exports ui/ac/matcher */[
    'jquery',
    'underscore',
    'core/base',
    'core/string'
], function(
    $,
    _,
    base,
    core_string) {


   var stringify = function(value) {
       var result = value;
       if(!_.isString(value)) {
           result = String(value);
       }
       return result;
   };

    var MatcherBase = base.Base.extend(
    /** @lends module:ui/ac/matcher~MatcherBase.prototype */ {
        
        /**
         * MatcherBase constructor
         * @constructor
         * @augments module:core/base~Base
         * @param {object} options Options object
         */
        initialize: function(options) {
            options = _.extend({
                stringify: stringify
            }, options);
            this.setStringify(options.stringify);
        },

        getStringify: function() {
            return this.stringify;
        },

        setStringify: function(value) {
            this.stringify = value;
        },
        
        match: function(search, maxResults, matchHandler) {
        }
    });

    var CollectionMatcher = MatcherBase.extend(
    /** @lends module:ui/ac/matcher~CollectionMatcher.prototype */ {
        
        /**
         * Matcher constructor
         * @constructor
         * @augments module:ui/ac/matcher~MatcherBase
         * @param {object} options Options object
         */
        initialize: function(options) {
            MatcherBase.prototype.initialize.call(this, options);
            this.setCollection(options.collection);
        },

        getCollection: function() {
            return this.collection;
        },

        setCollection: function(collection) {
            this.collection = collection;
            return this;
        },

        match: function(search, maxResults, matchHandler) {
            var matches = this._getPrefixMatches(search, maxResults);
            matchHandler(search, matches);
        },

        _getPrefixMatches: function(token, maxResults) {
            var results = [];
            var escapedToken = core_string.regExpEscape(token);
            var regex = new RegExp('(^|\\W+)' + escapedToken, 'i');

            this.collection.each(function(model) {
                if(results.length < maxResults) {
                    var string = this.stringify(model);
                    if(string.match(regex)) {
                        results.push(model);
                    }
                }
            }, this);

            results.sort();

            return results;
        }
    });
    
    var QueryMatcher = MatcherBase.extend(
    /** @lends ui/ac/matcher~QueryMatcher.prototype */ {

        /**
         * QueryMatcher constructor
         * @constructs
         * @augments ui/ac/matcher~MatcherBase
         * @param {object} options Options object
         */
        initialize: function(options) {
            MatcherBase.prototype.initialize.call(this, options);
            this.setQueryFactory(options.queryFactory);
            this.setMap(options.map);
        },

        getQueryFactory: function() {
            return this.query;
        },

        setQueryFactory: function(queryFactory) {
            this.queryFactory = queryFactory;
        },

        getMap: function() {
            return this.map;
        },

        setMap: function(map) {
            this.map = map;
            return this;
        },

        match: function(search, maxResults, matchHandler) {
            var that = this;
            var query = this.queryFactory.create({
                search: search
            }).slice(0, maxResults);

            query.fetch({
                success: function() {
                    that.onQuerySuccess(query, matchHandler);
                }
            });
        },

        onQuerySuccess: function(query, matchHandler) {
            var collection = query.instance;
            var matches = collection.models;
            if(this.map) {
                matches = collection.map(this.map);
            }
            matchHandler(query, matches);
        }
    });

    return {
        MatcherBase: MatcherBase,
        CollectionMatcher: CollectionMatcher,
        QueryMatcher: QueryMatcher
    };

});
