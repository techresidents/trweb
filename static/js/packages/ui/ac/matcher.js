define(/** @exports ui/ac/matcher */[
    'jquery',
    'underscore',
    'core'
], function(
    $,
    _,
    core) {

    var MatcherBase = core.base.Base.extend(
    /** @lends module:ui/ac/matcher~MatcherBase.prototype */ {
        
        /**
         * MatcherBase constructor
         * @constructor
         * @augments module:core/base~Base
         * @param {object} options Options object
         * @param {function} [options.stringify] Function used to convert
         *   models into a searchable string (so that the matching can
         *   happen against the specified search string)
         * @param {function} [options.sort=stringify] Function used to sort
         *   matcher result. If not provided, defaults to the stringify method.
         *   Setting this option to null will prevent sorting altogether.
         */
        initialize: function(options) {
            options = _.extend({
                sortByStringify: true,
                stringify: core.string.stringify,
                sort: options.stringify || core.string.stringify
            }, options);

            this.setStringify(options.stringify);
            this.setSort(options.sort);
        },

        getStringify: function() {
            return this.stringify;
        },

        setStringify: function(value) {
            this.stringify = value;
        },

        getSort: function() {
            return this.sort;
        },

        setSort: function(value) {
            this.sort = value;
        },
        
        match: function(search, maxResults, matchHandler) {
        },

        _getPrefixMatches: function(items, token, maxResults) {
            var results = [];
            var escapedToken = core.string.regExpEscape(token);
            var regex = new RegExp('(^|\\W+)' + escapedToken, 'i');

            _.each(items, function(item) {
                if(results.length < maxResults) {
                    var string = this.stringify(item);
                    if(!token || string.match(regex)) {
                        results.push(item);
                    }
                }
            }, this);

            if (this.sort) {
                results = _.sortBy(results, function(item) {
                    return this.sort(item);
                }, this);
            }

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
            return this.queryFactory;
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
                    collection.length);

            if(this.map) {
                matches = _.map(matches, this.map);
                matches = _.filter(matches, function(match) {
                    return (!_.isNull(match)) && (!_.isUndefined(match));
                });
                matches = _.first(matches, maxResults);
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
