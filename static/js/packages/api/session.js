define([
    'jquery',
    'underscore',
    'backbone',
    'core'
], function(
    $,
    _,
    Backbone,
    core) {
    
    /**
     * Map from api session names to ApiSession objects.
     */
    var sessions = {};
    
    /**
     * Map from api session names to cache objects.
     */
    var caches = {};

    /**
     * Extremely simple gc
     */
    var gc = function() {
        _.each(sessions, function(session, name) {
            session.gc();
        });
    };
    setInterval(gc, 60000);

    /**
     * ApiSession
     * @constructor
     * @param {Object} attributes
     * @param {Object} options
     */
    var ApiSession = core.base.Base.extend({

        initialize: function(options) {
            options = _.extend({
                name: 'global',
                expire: 300000
            }, options);
            this.name = options.name;
            this.expire = options.expire;

            if(!caches.hasOwnProperty(this.name)) {
                caches[this.name] = {
                    byKey: {},       //map from unique key to model/collection
                    byCollection: {} //map from collection class to collection key map
                };
            } 
            this.cache = caches[this.name];
        },

        gc: function() {
            var now = new Date().getTime();
            _.each(this.cache.byKey, function(entry, key) {
                var expire = entry.expire || this.expire;
                if(now > entry.timestamp + expire) {
                    delete this.cache.byKey[key];
                }
            }, this);
        },

        getModel: function(key, query) {
            var entry, state;
            var model;
            var uriObject = {}, result = null;
            key = this.expandKey(key, query);

            if(query) {
                uriObject = query.toUriObject();
            }
            
            entry = this.cache.byKey[key];
            if(entry) {
                model = entry.model.clone();
                if(uriObject['with']) {
                    state = model.isLoadedWith.apply(
                                model,
                                uriObject['with'].split(','));
                    if(state.loaded) {
                        result = model;
                    }
                } else {
                    result = model;
                }
            }

            return result;
        },

        putModel: function(model, key, expire) {
            key = key || model.key();
            if(model.isDirty()) {
                throw new Error('cannot cache dirty model');
            }

            this.cache.byKey[key] = {
                model: model.clone(),
                timestamp: new Date().getTime(),
                expire: expire
            };
            this.trigger('put:' + key, model);
        },

        removeModel: function(model, key) {
            key = key || model.key();
            delete this.cache.byKey[key];
            this.trigger('remove:' + key);
        },

        getCollection: function(key, query) {
            var entry, state;
            var collection, model;
            var uriObject = {}, result = null;
            key = this.expandKey(key, query);

            if(query) {
                uriObject = query.toUriObject();
            }

            entry = this.cache.byKey[key];
            if(entry) {
                models = _.map(entry.modelKeys, function(key) {
                    return this.getModel(key);
                }, this);

                if(_.indexOf(models, null) === -1) {
                    collection = entry.collection.clone();
                    collection.reset(models);
                    
                    if(uriObject['with']) {
                        state = collection.isLoadedWith.apply(
                                    collection,
                                    uriObject['with'].split(','));
                        if(state.loaded) {
                            result = collection;
                        }

                    } else {
                        result = collection;
                    }
                }
            }

            return result;
        },

        putCollection: function(collection, key, query, expire) {
            var byCollection, baseKey;
            key = key || collection.key();
            key = this.expandKey(key, query);

            this.cache.byKey[key] = {
                modelKeys: collection.map(function(model) {
                    return model.key();
                }),
                collection: collection.clone().reset(),
                timestamp: new Date().getTime(),
                expire: expire
            };
            
            baseKey = collection.constructor.key();
            byCollection = this.cache.byCollection[baseKey];
            if(!byCollection) {
                byCollection = this.cache.byCollection[baseKey] = {};
            }
            byCollection[key] = key;

            this.trigger('put:' + key, collection);
        },

        removeCollection: function(collection, key, query) {
            var baseKey = collection.constructor.key();
            key = key || collection.key();
            key = this.expandKey(key, query);
            delete this.cache.byKey[key];
            delete this.cache.byCollection[baseKey][key];
            this.trigger('remove:' + key);
        },

        removeAllCollections: function(collection) {
            var baseKey = collection.constructor.key();
            var keys = _.keys(this.cache.byCollection[baseKey] || {});
            _.each(keys, function(key) {
                delete this.cache.byKey[key];
                this.trigger('remove:' + key);
            }, this);
            this.cache.byCollection[baseKey] = {};
        },

        getFetch: function(key, query) {
            key = key || instance.key();
            key = 'fetch:' + this.expandKey(key, query);
            var result = null;
            var entry = this.cache.byKey[key];

            if(entry) {
                result = entry.fetch;
            }

            return result;
        },

        putFetch: function(instance, key, query) {
            key = key || instance.key();
            key = this.expandFetchKey(key, query);

            this.cache.byKey[key] = {
                timestamp: new Date().getTime(),
                fetch:  {
                    success: [],
                    error: []
                }
            };

            var syncHandler = function(instance, response, options) {
                var entry;
                var syncKey = this.expandFetchKey(instance.key(), options.query);
                if(syncKey === key) {
                    entry = this.cache.byKey[key];
                    if(entry) {
                        _.each(entry.fetch.success, function(callback) {
                            callback(instance, response, options);
                        }, this);
                    delete this.cache.byKey[key];
                    instance.off('sync', syncHandler);
                    }
                }
            };

            var errorHandler = function(instance, response, options) {
                var entry;
                var syncKey = this.expandFetchKey(instance.key(), options.query);
                if(syncKey === key) {
                    entry = this.cache.byKey[key];
                    if(entry) {
                        _.each(entry.fetch.error, function(callback) {
                            callback(instance, response, options);
                        }, this);
                    }
                    delete this.cache.byKey[key];
                    instance.off('error', errorHandler);
                }
            };

            instance.on('sync', syncHandler, this);
            instance.on('error', errorHandler, this);
        },

        expandKey: function(key, query) {
            var result = key;
            var uri;
            if(query) {
                uri = query.toUri();
                if(uri) {
                    result = key + '?' + uri;
                }
            }
            return result;
        },

        expandFetchKey: function(key, query) {
            return 'fetch:' + this.expandKey(key, query);
        }

    }, {
        get: function(name) {
            var result;
            name = name || 'global';

            if(sessions.hasOwnProperty(name)) {
                result = sessions[name];
            } else {
               result = new ApiSession(name);
               sessions[name] = result;
            }
            return result;
        }
    });

    _.extend(ApiSession.prototype, Backbone.Events);

    return {
        ApiSession: ApiSession
    };
});
