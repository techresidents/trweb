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
                stringify: core_string.stringify
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
        },

        _getPrefixMatches: function(items, token, maxResults) {
            var results = [];
            var escapedToken = core_string.regExpEscape(token);
            var regex = new RegExp('(^|\\W+)' + escapedToken, 'i');

            _.each(items, function(item) {
                if(results.length < maxResults) {
                    var string = this.stringify(item);
                    if(string.match(regex)) {
                        results.push(item);
                    }
                }
            }, this);

            results = _.sortBy(results, function(item) {
                return this.stringify(item);
            }, this);

            return results;
        }
    });

    var ArrayMatcher = MatcherBase.extend(
    /** @lends module:ui/ac/matcher~ArrayMatcher.prototype */ {
        
        /**
         * Matcher constructor
         * @constructor
         * @augments module:ui/ac/matcher~MatcherBase
         * @param {object} options Options object
         */
        initialize: function(options) {
            MatcherBase.prototype.initialize.call(this, options);
            this.setData(options.data);
        },

        getData: function() {
            return this.data;
        },

        setData: function(data) {
            this.data = data;
            return this;
        },

        match: function(search, maxResults, matchHandler) {
            var matches = this._getPrefixMatches(
                    this.data,
                    search,
                    maxResults);
            matchHandler(search, matches);
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
            var matches = this._getPrefixMatches(
                    this.collection.models,
                    search,
                    maxResults);
            matchHandler(search, matches);
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
                search: search,
                maxResults: maxResults
            });

            query.fetch({
                success: function() {
                    that.onQuerySuccess(search, maxResults, matchHandler, query);
                }
            });
        },

        onQuerySuccess: function(search, maxResults, matchHandler, query) {
            var collection = query.instance;
            var matches = this._getPrefixMatches(
                    collection.models,
                    search,
                    maxResults);

            if(this.map) {
                matches = _.map(matches, this.map);
                matches = _.filter(matches, function(match) {
                    return (!_.isNull(match)) && (!_.isUndefined(match));
                });
            }

            matchHandler(search, matches);
        }
    });

    return {
        MatcherBase: MatcherBase,
        ArrayMatcher: ArrayMatcher,
        CollectionMatcher: CollectionMatcher,
        QueryMatcher: QueryMatcher
    };

});
