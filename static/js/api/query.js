define([
    'jquery',
    'underscore',
    'backbone',
    'core/base',
    'core/uri',
    'api/fetcher'
], function(
    $,
    _,
    Backbone,
    base,
    uri,
    api_fetcher) {
        
    
    /**
     * ApiQueryFilter
     * @constructor
     * @param {Object} attributes (optional)
     * @param {Object} options  (optional)
     */
    var ApiQueryFilter = Backbone.Model.extend({

        defaults: function() {
            return {
                name: null,
                op: 'eq',
                value: null
            };
        },

        name: function() {
            return this.get('name');
        },

        setName: function(value) {
            this.set({name: value});
            return this;
        },

        op: function() {
            return this.get('op');
        },

        setOp: function(value) {
            this.set({op: value});
            return this;
        },

        value: function() {
            return this.get('value');
        },

        setValue: function(value) {
            this.set({value: value});
            return this;
        },

        toUriObject: function() {
            var result = {};
            if(this.op() === 'eq') {
                result[this.name()] = this.value();
            } else {
                result[this.name() + '__' + this.op()] = this.value();
            }
            return result;
        }

    }, {
        OPERATIONS: {
            'eq': 'eq',
            'gt': 'gt',
            'gte': 'gte',
            'lt': 'lt',
            'lte': 'lte',
            'contains': 'contains',
            'exact': 'exact',
            'in': 'in',
            'startswith': 'startswith',
            'istartswith': 'istartswith',
            'endswith': 'endswith',
            'iendswith': 'iendswith',
            'range': 'range',
            'ranges': 'ranges',
            'isnull': 'isnull'
        },

        parse: function(name, value) {
            var result, parts, op;
            
            //i.e. name='requisition__status__in=OPEN,CLOSED'
            if(value === undefined || value === null) {
                parts = name.split('=');
                name = _.first(parts);
                value = _.rest(parts).join('=');
            }

            //i.e. name='requisition__status__in' and value='OPEN,CLOSED'
            parts = name.split('__');
            op = _.last(parts).toLowerCase();
            if(ApiQueryFilter.OPERATIONS.hasOwnProperty(op)) {
                parts.pop();
                name = parts.join('__');
            } else {
                //default op to 'eq'
                op = 'eq';
            }
            
            result = new ApiQueryFilter({
                name: name,
                op: op,
                value: value
            });

            return result;
        }
    });

    /**
     * ApiQueryFilterCollection
     */
    var ApiQueryFilterCollection = Backbone.Collection.extend({
        model: ApiQueryFilter,

        toUriObject: function() {
            var result = {};
            this.each(function(filter) {
                _.extend(result, filter.toUriObject());
            });
            return result;
        }
    });

    /**
     * ApiQueryWithRelation
     * @constructor
     * @param {Object} attributes (optional)
     * @param {Object} options  (optional)
     */
    var ApiQueryWithRelation = Backbone.Model.extend({

        idAttribute: 'value',

        defaults: function() {
            return {
                value: null
            };
        },

        value: function() {
            return this.get('value');
        },

        setValue: function(value) {
            this.set({value: value});
            return this;
        }
    });

    /**
     * ApiQueryWithRelationCollection
     */
    var ApiQueryWithRelationCollection = Backbone.Collection.extend({
        model: ApiQueryWithRelation,

        toUriObject: function() {
            return {
                'with': this.pluck('value').join()
            };
        }
    });

    /**
     * ApiQueryOrderBy
     * @constructor
     * @param {Object} attributes (optional)
     * @param {Object} options  (optional)
     */
    var ApiQueryOrderBy = Backbone.Model.extend({

        idAttribute: 'value',

        defaults: function() {
            return {
                value: null,
                direction: 'ASC'
            };
        },

        value: function() {
            return this.get('value');
        },

        setValue: function(value) {
            this.set({value: value});
            return this;
        },

        direction: function() {
            return this.get('direction');
        },

        setDirection: function(direction) {
            this.set({direction: direction});
            return this;
        }
    }, {
        parse: function(value) {
            var parts = value.split('__');
            var direction = _.last(parts).toUpperCase();
            if(direction === 'ASC' || direction === 'DESC') {
                parts.pop();
            } else {
                direction = 'ASC';
            }

            return new ApiQueryOrderBy({
                value: parts.join('__'),
                direction: direction
            });
        }
    });

    /**
     * ApiQueryOrderByCollection
     */
    var ApiQueryOrderByCollection = Backbone.Collection.extend({
        model: ApiQueryOrderBy,

        toUriObject: function() {
            return {
                order_by: this.map(function(model) {
                    return model.value() + '__' + model.direction();
                }).join()
            };
        }
    });

    /**
     * ApiQuerySlice
     * @constructor
     * @param {Object} attributes (optional)
     * @param {Object} options  (optional)
     */
    var ApiQuerySlice = Backbone.Model.extend({

        defaults: function() {
            return {
                start: 0,
                end: 20
            };
        },

        start: function() {
            return this.get('start');
        },

        setStart: function(value) {
            this.set({start: value});
            return this;
        },

        end: function() {
            return this.get('end');
        },

        setEnd: function(value) {
            this.set({end: value});
            return this;
        },

        toUriObject: function() {
            var slice = '';
            slice += this.start() + ',' + this.end();
            return {
                slice: slice
            };
        }
    });

    /**
     * ApiQueryState
     * @constructor
     * @param {Object} attributes (optional)
     * @param {Object} options  (optional)
     */
    var ApiQueryState = Backbone.Model.extend({

        defaults: function() {
            return {
                filters: new ApiQueryFilterCollection(),
                withRelations: new ApiQueryWithRelationCollection(),
                orderBys: new ApiQueryOrderByCollection(),
                slice: null,
                noSession: false
            };
        },

        filters: function() {
            return this.get('filters');
        },

        withRelations: function() {
            return this.get('withRelations');
        },

        orderBys: function() {
            return this.get('orderBys');
        },

        slice: function() {
            return this.get('slice');
        },

        noSession: function() {
            return this.get('noSession');
        }
    });


    /**
     * ApiQuery
     * @constructor
     * @param {Object} options
     *   model: {ApiModel} (required if collection not provided)
     *   collection: {ApiCollection} (required if model not provided)
     */
    var ApiQuery = base.Base.extend({
        initialize: function(options) {
            options = options || {};
            this.instance = options.model || options.collection;
            this.state = new ApiQueryState();
            this.queryChain = [];
            this.queryChainCallback = null;
        },

        noSession: function(value) {
            if(_.isUndefined(value)) {
                value = true;
            }

            this.state.set({
                noSession: value
            });
        },

        filterBy: function(filters) {
            var filter;
            var filterCollection = this.state.filters();
            _.each(filters, function(value, name) {
                filter = ApiQueryFilter.parse(name, value);
                filterCollection.add(filter);
            });
            return this;
        },

        withRelated: function() {
            var arg;
            var withRelations = this.state.withRelations();
            _.each(arguments, function(arg) {
                if(_.isArray(arg)) {
                    _.each(arg, function(value) {
                        if(value) {
                            withRelations.add(new ApiQueryWithRelation({
                                value: value
                            }));
                        }
                    });
                } else {
                    if(arg) {
                        withRelations.add(new ApiQueryWithRelation({
                            value: arg
                        }));
                    }
                }
            });
            return this;
        },

        orderBy: function() {
            var arg;
            var orderBys = this.state.orderBys();
            _.each(arguments, function(arg) {
                if(_.isArray(arg)) {
                    _.each(arg, function(value) {
                        if(value) {
                            orderBys.add(ApiQueryOrderBy.parse(value));
                        }
                    });
                } else {
                    if(arg) {
                        orderBys.add(ApiQueryOrderBy.parse(arg));
                    }
                }
            });
            return this;
        },

        slice: function(start, end) {
            var slice = new ApiQuerySlice({
                start: start,
                end: end
            });
            this.state.set({
                slice: slice
            });
            return this;
        },

        chain: function(queryChain, callback) {
            if(_.isArray(queryChain)) {
                this.queryChain = queryChain;
            } else {
                this.queryChain = [queryChain];
            }
            this.queryChainCallback = callback;
            return this;
        },

        fetch: function(options) {
            //handle chained queries
            var queryChainSuccess = function() {
                if(_.isFunction(this.queryChainCallback)) {
                    var args = _.pluck(this.queryChain, 'instance');
                    this.queryChainCallback.apply(this, args);
                }
                this.instance.fetch(this._fetchOptions(options));
            };
            if(this.queryChain.length) {
                new api_fetcher.ApiFetcher(this.queryChain).fetch({
                    success: _.bind(queryChainSuccess, this)
                    });
            } else {
                this.instance.fetch(this._fetchOptions(options));
            }
            
        },

        toUriObject: function() {
            var result = {};
            var filters = this.state.filters();
            var withRelations = this.state.withRelations();
            var orderBys = this.state.orderBys();
            var slice = this.state.slice();

            if(filters.length) {
                _.extend(result, filters.toUriObject());
            }
            if(withRelations.length > 0) {
                _.extend(result, withRelations.toUriObject());
            }
            if(orderBys.length > 0) {
                _.extend(result, orderBys.toUriObject());
            }
            if(slice) {
                _.extend(result, slice.toUriObject());
            }
            return result;
        },

        toUri: function(options) {
            var result;
            var terms = [];
            var uriObject = this.toUriObject();
            options = _.extend({
                includeWithRelations: false
            }, options);
            
            if(!options.includeWithRelations) {
                delete uriObject['with'];
            }
            _.each(uriObject, function(value, key) {
                //encode value and key using encodeURIPathSegment
                //instead of encodeURIComponent since the URI
                //is destined for the path segment. This makes
                //for better looking URI's.
                value = uri.encodeURIPathSegment(value);
                key = uri.encodeURIPathSegment(key);
                terms.push(key + '=' + value);
            });
            
            result = terms.join(';');
            return result;
        },

        _fetchOptions: function(options) {
            options = _.extend({
                query: this,
                noSession: this.state.noSession()
            }, options);
            if(!options.hasOwnProperty("data")) {
                options.data = {};
            }
            _.extend(options.data, this.toUriObject());
            return options;
        }
    }, {

        parse: function(instance, query) {
            var result = instance.query();
            var parts, key, value, uriObject = {};

            if(_.isString(query)) {
                //i.e. query = 'status__in=OPEN,CLOSED;slice=10,20;order_by=created__ASC'
                var terms = query.split(';');
                _.each(terms, function(terms) {
                    parts = terms.split('=');
                    key = decodeURIComponent(_.first(parts));
                    value  = decodeURIComponent(_.rest(parts).join('='));
                    uriObject[key] = value;
                });
            } else if(_.isObject(query)) {
                uriObject = query;
            }

            if(uriObject.hasOwnProperty('order_by')) {
                result.orderBy(uriObject.order_by.split(','));
                delete uriObject.order_by;
            }
            if(uriObject.hasOwnProperty('slice')) {
                var slice_args = uriObject.slice.split(',');
                result.slice(_.first(slice_args), _.last(slice_args));
                delete uriObject.slice;
            }
            if(uriObject.hasOwnProperty('with')) {
                result.withRelated(uriObject['with'].split(','));
                delete uriObject['with'];
            }
            
            result.filterBy(uriObject);

            return result;
        }
    });

    return {
        ApiQuery: ApiQuery,
        ApiQueryFilter: ApiQueryFilter,
        ApiQueryFilterCollection: ApiQueryFilterCollection,
        ApiQueryWithRelation: ApiQueryWithRelation,
        ApiQueryWithRelationCollection: ApiQueryWithRelationCollection,
        ApiQueryOrderBy: ApiQueryOrderBy,
        ApiQueryOrderByCollection: ApiQueryOrderByCollection
    };
});
