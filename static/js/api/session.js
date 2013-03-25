define([
    'jquery',
    'underscore',
    'core/base'
], function(
    $,
    _,
    base) {
    
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
    var ApiSession = base.Base.extend({

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
            _.each(this.cache, function(entry, key) {
                if(now > entry.timestamp + this.expire) {
                    delete this.cache[key];
                }
            }, this);
        },

        getModel: function(key, query) {
            var entry, state;
            var model;
            var uriObject = {}, result = null;
            key = this._expandKey(key, query);

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

        putModel: function(model, key) {
            key = key || model.key();
            
            this.cache.byKey[key] = {
                model: model.clone(),
                timestamp: new Date().getTime()
            };
        },

        removeModel: function(model, key) {
            key = key || model.key();
            delete this.cache.byKey[key];
        },

        getCollection: function(key, query) {
            var entry, state;
            var collection, model;
            var uriObject = {}, result = null;
            key = this._expandKey(key, query);

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

        putCollection: function(collection, key, query) {
            var byCollection, baseKey;
            key = key || collection.key();
            key = this._expandKey(key, query);

            this.cache.byKey[key] = {
                modelKeys: collection.map(function(model) {
                    return model.key();
                }),
                collection: collection.clone().reset(),
                timestamp: new Date().getTime()
            };
            
            baseKey = collection.constructor.key();
            byCollection = this.cache.byCollection[baseKey];
            if(!byCollection) {
                byCollection = this.cache.byCollection[baseKey] = {};
            }
            byCollection[key] = key;
        },

        removeCollection: function(collection, key, query) {
            var baseKey = collection.constructor.key();
            key = key || collection.key();
            key = this._expandKey(key, query);
            delete this.cache.byKey[key];
            delete this.cache.byCollection[baseKey][key];
        },

        removeAllCollections: function(collection) {
            var baseKey = collection.constructor.key();
            var keys = _.keys(this.cache.byCollection[baseKey] || {});
            _.each(keys, function(key) {
                delete this.cache.byKey[key];
            }, this);
            this.cache.byCollection[baseKey] = {};
        },

        getFetch: function(key, query) {
            key = key || instance.key();
            key = 'fetch:' + this._expandKey(key, query);
            var result = null;
            var entry = this.cache.byKey[key];

            if(entry) {
                result = entry.fetch;
            }

            return result;
        },

        putFetch: function(instance, key, query) {
            key = key || instance.key();
            key = this._expandFetchKey(key, query);

            this.cache.byKey[key] = {
                timestamp: new Date().getTime(),
                fetch:  {
                    success: [],
                    error: []
                }
            };

            var syncHandler = function(instance, response, options) {
                var entry;
                var syncKey = this._expandFetchKey(instance.key(), options.query);
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
                var syncKey = this._expandFetchKey(instance.key(), options.query);
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

        _expandKey: function(key, query) {
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

        _expandFetchKey: function(key, query) {
            return 'fetch:' + this._expandKey(key, query);
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

    return {
        ApiSession: ApiSession
    };
});
