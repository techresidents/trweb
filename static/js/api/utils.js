define([
    'jquery',
    'underscore',
    'backbone',
    'xd/backbone'
], function(
    $,
    _,
    Backbone,
    xdBackbone) {

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

        if(method === 'read' && options.data && options.data['with']) {
            withRelated = options.data['with'].split(',');
        }

        this._loading = true;
        this.eachRelated(withRelated, function(instance) {
            instance._loading = true;
        });

        options.success = function() {
            if(_.isFunction(success)) {
                success.apply(this, arguments);
            }

            this.eachRelated(withRelated, function(instance) {
                instance._loading = false;

                //clear dirty flag
                if(instance.hasOwnProperty('_isDirty')) {
                    instance._isDirty = false;
                }

                instance.trigger('loaded', this);

            });
            this._loading = false;

            if(this.hasOwnProperty('_isDirty')) {
                this._isDirty = false;
            }

            this.trigger('loaded', this);

        };
        options.success = _.bind(options.success, this);

        options.error = function() {
            if(_.isFunction(error)) {
                error.apply(this, arguments);
            }

            this.eachRelated(withRelated, function(instance) {
                instance._loaded = true;
                instance._loading = false;
            });
            this._loading = false;

        };
        options.error = _.bind(options.error, this);

        return xdBackbone.sync(method, model, options);
    };

    /**
     * ApiModel/ApiCollection each related method.
     * @param {Array} or {String} relations, i.e. user__skills__technology
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
    var eachRelated = function(relations, callback, context, depth) {
        var relation;
        
        context = context || this;
        depth = depth || 0;

        if(!relations) {
            return;
        }

        if(depth === 0) {
            if(_.isArray(relations)) {
                _.each(relations, function(relation) {
                    this.eachRelated(relation, callback, context, depth);
                }, this);
                return;
            }
            relations = relations.split('__');
        }

        if(this instanceof Backbone.Collection) {
            this.invoke('eachRelated', relations, callback, context, depth+1);
        } else if(relations.length) {
            relation = this.getRelation(relations[0]);
            relation.eachRelated(_.rest(relations, 1), callback, context, depth+1);
        }

        if(depth) {
            callback.call(context, this);
        }
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
     * relation path are loaded. Note that in the case of ApiCollection's,
     * only the first model is tested as an optimization.
     *
     */
    var isLoadedWith = function() {
        var i, j, current, collection, relation, relations, query;
        var fetchers = [];
        var result = {
            loaded: true,
            fetcher: null
        };

        if(!this.isLoaded()) {
            query = this.withRelated.apply(this, arguments);
            return {
                loaded: false,
                fetcher: _.bind(query.fetch, query)
            };
        }

        for(i=0; i < arguments.length; i++) {
            current = this;
            relations = arguments[i].split('__');
            for(j=0; j < relations.length; j++) {
                relation = relations[j];
                if(current instanceof Backbone.Collection) {
                    collection = current;
                    if(current.length) {
                        current = current.at(0).getRelation(relation);
                    } else {
                        break;
                    }
                } else {
                    collection = null;
                    current = current.getRelation(relation);
                }

                if(!current.isLoaded()) {
                    if(collection) {
                        query = collection.withRelated(_.rest(relations, j).join('__'));
                        fetchers.push(_.bind(query.fetch, query));
                    } else {
                        query = current.withRelated(_.rest(relations, j+1).join('__'));
                        fetchers.push(_.bind(query.fetch, query));
                    }
                    break;
                }
            }

        }
        
        if(fetchers.length) {
            result.loaded = false;
            result.fetcher = function(options) {
                var i, fetcher;
                var error = 0;
                var success = 0;
                options = options || {};

                var errorCallback = function() {
                    error += 1;
                    if(error + success >= fetchers.length) {
                        if(error) {
                            if(_.isFunction(options.error)) {
                                options.error.apply(this, arguments);
                            }
                        }
                        else {
                            if(_.isFunction(options.success)) {
                                options.success.apply(this, arguments);
                            }
                        }
                    }
                };
                var successCallback = function(instance, response) {
                    success += 1;
                    if(error + success >= fetchers.length) {
                        if(error) {
                            if(_.isFunction(options.error)) {
                                options.error.apply(this, arguments);
                            }
                        }
                        else {
                            if(_.isFunction(options.success)) {
                                options.success.apply(this, arguments);
                            }
                        }
                    }
                };

                for(i=0; i < fetchers.length; i++) {
                    fetcher = fetchers[i];
                    fetcher({
                        success: successCallback,
                        error: errorCallback
                    });
                }
            };
        }

        return result;
    };

    return {
        sync: sync,
        eachRelated: eachRelated,
        isLoadedWith: isLoadedWith
    };
});
