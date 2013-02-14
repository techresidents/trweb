define([
    'jquery',
    'underscore',
    'backbone',
    'core/base'
], function(
    $,
    _,
    Backbone,
    base) {

    /**
     * ApiQueryFilter
     * @constructor
     * @param {Object} attributes (optional)
     * @param {Object} options  (optional)
     */
    var ApiQueryFilter = Backbone.Model.extend({

        idAttribute: 'name',

        defaults: function() {
            return {
                name: null,
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

        value: function() {
            return this.get('value');
        },

        setValue: function(value) {
            this.set({value: value});
            return this;
        }
    });

    /**
     * ApiQueryFilterCollection
     */
    var ApiQueryFilterCollection = Backbone.Collection.extend({
        model: ApiQueryFilter,

        asObject: function() {
            var result = {};
            this.each(function(filter) {
                result[filter.name()] = filter.value();
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

        asCSV: function() {
            return this.pluck('value').join();
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

        asCSV: function() {
            return this.map(function(model) {
                return model.value() + '__' + model.direction();
            });
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

        asCSV: function() {
            var result = '';
            result += this.start() + ',' + this.end();
            return result;
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
                order: null,
                slice: null
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

        order: function() {
            return this.get('order');
        },

        slice: function() {
            return this.get('slice');
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
        },

        filterBy: function(filters) {
            var filterCollection = this.state.getFilters();
            _.each(filters, function(value, name) {
                filterCollection.add(new ApiQueryFilter({
                    name: name,
                    value: value
                }));
            });
            _.extend(this.filters, filters);
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

        fetch: function(options) {
            var filters = this.state.filters();
            var withRelations = this.state.withRelations();
            var orderBys = this.state.orderBys();
            var order = this.state.order();
            var slice = this.state.slice();

            options = options || {};
            if(!options.hasOwnProperty("data")) {
                options.data = {};
            }
            
            if(filters.length) {
                _.extend(options.data, filters.asObject());
            }
            if(withRelations.length > 0) {
                options.data['with'] = withRelations.asCSV();
            }
            if(orderBys.length > 0) {
                options.data.order_by = orderBys.asCSV();
            }
            if(order) {
                options.data.order = order.value();
            }
            if(slice) {
                options.data.slice = slice.asCSV();
            }

            return this.instance.fetch(options);
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
