define([
    'jquery',
    'underscore',
    'backbone',
    'xd',
    './fetcher'
], function(
    $,
    _,
    Backbone,
    xd,
    api_fetcher) {

    /**
     * ApiModel/ApiCollection backbone sync method.
     * @param {String} method
     * @param {ApiModel} or {ApiCollection} model
     * @param {Object} options
     *
     * In addition to normal data syncing, this
     * method will also update the model/collection
     * load state and dispatch a 'loaded' event
     * following a successful read.
     */
    var sync = function(method, model, options) {
        var success = options.success;
        var error = options.error;
        var withRelated = null;
        var events = 'loaded:' + method + ' loaded';

        if(method === 'read' && options.data && options.data['with']) {
            withRelated = options.data['with'].split(',');
        }

        this._loading = true;
        this.eachRelated(withRelated, function(current) {
            current.instance._loading = true;
        }, this);

        options.success = function() {
            if(_.isFunction(success)) {
                success.apply(this, arguments);
            }

            this.eachRelated(withRelated, function(current) {
                current.instance._loading = false;

                current.instance.trigger(events, current.instance);

            }, this);
            this._loading = false;

            this.trigger(events, this);

        };
        options.success = _.bind(options.success, this);

        options.error = function() {
            if(_.isFunction(error)) {
                error.apply(this, arguments);
            }

            this.eachRelated(withRelated, function(current) {
                current.instance._loaded = true;
                current.instance._loading = false;
            }, this);
            this._loading = false;

        };
        options.error = _.bind(options.error, this);

        return xd.backbone.sync(method, model, options);
    };

    /**
     * ApiModel/ApiCollection each related method.
     * @param {Array} or {String} relations
     *   ['user', 'skills', 'technology'] or 'user__skills__technology'
     * @param {function} callback 
     * @param {context} context (optional callback context) 
     *   if not supplied context will default to model/collection.     
     * @param {Number} (internal depth counter)
     *
     * Traverses the supplied relation path,
     * i.e. user__skills__technology, and invokes the specified callback
     * for each related model/collection.
     *
     */
    var eachRelated = function(relations, callback, context, options) {
        options = _.extend({
            includeRoot: false,
            traverse: 'dfs'
        }, options);
        
        var traverse = options.traverse === 'bfs' ? this.bfsRelated : this.dfsRelated;

        if(_.isArray(relations)) {
            _.each(relations, function(relation) {
                traverse.call(this, relation, callback, context, options);
            }, this);
        } else {
            traverse.call(this, relations, callback, context, options);
        }

    };

    var bfsRelated = function(relations, callback, context, options) {
        var current, queue = [], count = 0;
        var push = function(parent, relations, instance) {
            queue.push({
                parent: parent,
                relations: relations,
                instance: instance
            });
        };
        options = _.extend({
            includeRoot: false
        }, options);


        relations = relations || [];
        if(_.isString(relations)) {
            relations = relations.split('__');
        }

        push(null, relations, this);

        while(queue.length) {
            current = queue.shift();
            if(count !== 0 || options.includeRoot) {
                if(callback.call(context, current)) {
                    break;
                }
            }

            if(current.instance instanceof Backbone.Collection) {
                current.instance.each(_.bind(push, this, current, current.relations));
            } else {
                if(current.relations.length) {
                    push(current,
                        _.rest(current.relations),
                        current.instance.getRelation(_.first(current.relations)));
                }
            }

            count += 1;
        }
    };

    var dfsRelated = function(relations, callback, context, options) {
        options = _.extend({
            includeRoot: false,
            depth: 0
        }, options);
        
        relations = relations || [];
        if(_.isString(relations)) {
            relations = relations.split('__');
        }

        var result, model, i = 0;
        var item = {
            parent: options.parent,
            relations: relations,
            instance: this
        };
        
        if(this instanceof Backbone.Collection) {
            for(i=0; i<this.length; i++) {
                model = this.at(i);
                result = model.dfsRelated(
                    relations,
                    callback,
                    context,
                    _.extend({}, options, {
                        parent: item,
                        depth: options.depth + 1
                    }));

                if(result) {
                    break;
                }
            }
        } else {
            if(relations.length) {
                var instance = this.getRelation(_.first(relations));
                result = instance.dfsRelated(
                        _.rest(relations),
                        callback,
                        context,
                        _.extend({}, options, {
                            parent: item,
                            depth: options.depth + 1
                        }));
            }
        }

        if(!result) {
            if(options.depth !== 0 || options.includeRoot) {
                result = callback.call(context, item);
            }
        }

        return result;
    };

    /**
     * ApiModel/ApiCollection isLoadedWith method.
     * @param {String} relations, i.e. user__skills__technology
     * @return {Object} status object containing the following:
     *   loaded: {boolean} true if all relations are loaded, false otherwise
     *   fetcher: if loaded is false, a function, which when called, will
     *   load all mising data.
     *
     * Tests if all models/collections in the specified
     * relation path are loaded.
     *
     */
    var isLoadedWith = function() {
        var queries, query, fetcher;
        var queryMap = {};
        var result = {
            loaded: true,
            fetcher: null
        };

        if(!this.isLoaded()) {
            query = this.withRelated.apply(this, arguments);
            queryMap[this.key()] = query;
        } else {
            _.each(arguments, function(relations) {
                this.bfsRelated(relations, function(current) {
                    if(!current.instance.isLoaded()) {
                        if(current.parent &&
                           current.parent.instance instanceof Backbone.Collection) {
                            key = current.parent.instance.key();
                            query = current.parent.instance.withRelated(
                                current.parent.relations.join('__'));
                        } else {
                            key = current.instance.key();
                            query = current.instance.withRelated(
                                current.relations.join('__'));
                        }
                        if(!queryMap.hasOwnProperty(key)) {
                            queryMap[key] = query;
                        }

                        //stop bfs traversal at this point since we added
                        //a query to handle current and its relations.
                        //if we don't do this we'll end up making multiple
                        //queries for the same data.
                        return true;
                    }
                }, this);
            }, this);
        }
        
        queries = _.values(queryMap);
        //if we end up with too many queries just execute the original
        if(queries.length > 4) {
            queries = [];
            query = this.withRelated.apply(this, arguments);
            queries.push(query);
        }

        if(queries.length) {
            fetcher = new api_fetcher.ApiFetcher(queries);
            result = {
                loaded: false,
                fetcher: fetcher
            };
        }

        return result;
    };

    return {
        sync: sync,
        eachRelated: eachRelated,
        bfsRelated: bfsRelated,
        dfsRelated: dfsRelated,
        isLoadedWith: isLoadedWith
    };
});
