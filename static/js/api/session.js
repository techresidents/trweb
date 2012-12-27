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
     * ApiSession
     * @constructor
     * @param {Object} attributes
     * @param {Object} options
     */
    var ApiSession = base.Base.extend({

        initialize: function(options) {
            options = options || {};
            this.name = options.name || 'global';
            if(!caches.hasOwnProperty(this.name)) {
                caches[this.name] = {};
            } 
            this.cache = caches[this.name];
        },

        getModel: function(constructor, key) {
            var result;
            var cacheKey = this._cacheKey(constructor, key);

            if(this.cache.hasOwnProperty(cacheKey)) {
                result = this.cache[cacheKey];
            } else {
                var id;
                if(!this._isUrl(key)) {
                    id = key;
                }
                result = new constructor({id: id}, {
                    session: this.name
                });
                this.cache[cacheKey] = result;
            }
            return result;
        },

        getCollection: function(constructor, key) {
            var result;
            var cacheKey = this._cacheKey(constructor, key);
            if(this.cache.hasOwnProperty(cacheKey)) {
                result = this.cache[cacheKey];
            } else {
                result = new constructor(null, {
                    session: this.name
                });
                this.cache[cacheKey] = result;
            }
            return result;
        },

        _isUrl: function(value) {
            return _.isString(value) && value.length && value[0] === '/';
        },

        _cacheKey: function(constructor, key) {
            var result;
            if(this._isUrl(key)) {
                result = key;
            } else {
                result = constructor.prototype.url() + '/' + key;
            }
            return result;
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
