define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    './config',
    './facet',
    './fields',
    './query',
    './session',
    './utils'
], function(
    $,
    _,
    Backbone,
    core,
    api_config,
    api_facet,
    api_fields,
    api_query,
    api_session,
    api_utils) {
    
    /**
     * ApiModel
     * @constructor
     * @param {Object} attributes
     * @param {Object} options
     */
    var ApiModel = Backbone.Model.extend({

        constructor: function(attributes, options) {
            var model;
            attributes = attributes || {};
            options = options || {};

            //configure session if neeed
            if(options.session ||
              (!options.noSession && api_config.defaultSession)) {
                this.session = api_session.ApiSession.get(
                    options.session || api_config.defaultSession);
            }

            if(!options.query) {
                options.query = new api_query.ApiQuery({
                    model: this
                });
            }
            this.setQuery(options.query);

            //if using session and being constructed with id
            //check the cache to see if we already have the model.
            //Note that the session will returned a cloned model
            //so no need to worry side effects.
            if(this.session && attributes.id) {
                model = this.session.getModel(
                    this.constructor.key(attributes.id, options.query));
            }
            
            //if the model is not in cache proceed with construction
            if(!model) {
                attributes.meta = {
                    "resource_name": core.base.getValue(this, "urlRoot").substring(1),
                    "resource_uri": null
                };

                Backbone.Model.prototype.constructor.call(this, attributes, options);
            
                this._parentRelation = null;
                this._loading = false;
                this._isDirty = false;
                this._loaded = undefined;

                // Listen on 'all' instead of 'change' because the generic
                // 'change' event is fired after 'change:<attribute>' events.
                // We want the dirty flag to be set before other listeners
                // process the event so that saves work properly.
                this.bind('all', function(eventName, model, value) {
                    if(eventName.indexOf('change') === 0) {
                        if(!this._loading) {
                            this._isDirty = true;
                        }
                    }
                }, this);
            } else {
                //short circuited constrctor so return model.
                //if a value is returned from ctor it will be
                //used as the new object instead of 'this'.
                return model;
            }
               
        },

        baseUrl: "/api/v1",

        url: function() {
            var result, fk, parent, field;
            var meta = this.get_meta();
            var baseUrl = core.base.getValue(this, 'baseUrl');
            var urlRoot = core.base.getValue(this, 'urlRoot');
            
            if(meta.resource_uri) {
                result = meta.resource_uri;
            }
            else if(!this.isNew()) {
                result = baseUrl + urlRoot + '/' + encodeURIComponent(this.id);
            } else if(this._parentRelation) {
                parent = this._parentRelation.instance;
                field = this._parentRelation.field;
                fk = this[field.name + '_id'];
                if(fk) {
                    result = baseUrl + urlRoot + '/' + encodeURIComponent(fk);
                } else {
                    result = core.base.getValue(parent, 'url') + '/' + encodeURIComponent(field.name);
                }
            } else {
                result = baseUrl + urlRoot;
            }
            return result;
        },

        key: function() {
            var result;
            var meta = this.get_meta();
            if(meta.resource_uri) {
                result = meta.resource_uri;
            } else {
                result = core.base.getValue(this, 'url'); 
            }

            //append query
            //Note that toUri() by default will not include with
            //relations. This is critical since the key should
            //reflect the state of this object and its data
            //and should not change just because the  withRelated
            //args happen to change.
            if(this.query().toUri()) {
                result += '?' + this.query().toUri();
            }

            return result;
        },

        isDirty: function() {
            return this._isDirty;
        },
        
        isLoading: function() {
            return this._loading;
        },

        isLoaded: function() {
            return this._loaded === this.key();
        },

        isLoadable: function() {
            var result = false;
            if(!this.isNew()) {
                result = true;
            } else if(this.getParentRelation()) {
                result = this.getParentRelation().isLoadable();
            }
            return result;
        },

        isLoadedWith: api_utils.isLoadedWith,
            
        bfsRelated: api_utils.bfsRelated,

        dfsRelated: api_utils.dfsRelated,

        eachRelated: api_utils.eachRelated,

        getRelation: function(fieldName, attributes) {
            var field = this.relatedFields[fieldName];
            return this[field.getterName](attributes);
        },

        getParentRelation: function() {
            var result = null;
            if(_.isObject(this._parentRelation)) {
                result = this._parentRelation.instnace;
            }
            return result;
        },

        bootstrap: function(data) {
            var options = {silent: true};
            //set silent to true to silence change events
            //which will mark models dirty.
            this.set(this.parse(data, options), options);
        },

        validate: function(attributes) {
            var name, field;
            var errors = {};

            for(name in attributes) {
                if(attributes.hasOwnProperty(name)) {
                    try {
                        if(this.fields.hasOwnProperty(name)) {
                            field = this.fields[name];
                        } else if(this.relatedFields.hasOwnProperty(name)) {
                            field = this.relatedFields[name];
                        } else {
                            errors.general = "unknown field";
                        }
                        attributes[name] = field.validate(attributes[name]);
                    }

                    catch(e) {
                        errors[name] = e.message;
                    }
                }
            }
            
            if(!_.isEmpty(errors)) {
                return errors;
            }
        },

        clone: function(options) {
            options = _.extend({
                attributes: this.attributes
            }, options);
            
            var result = options.to || new this.constructor();

            if(result === this) {
                return result;
            }

            if(options.withRelated) {
                _.each(options.withRelated, function(relations) {
                    relations = relations.split('__');
                    var fieldName = _.first(relations);
                    var relation = this.getRelation(fieldName);
                    var nextRelations = _.rest(relations).join('__');
                    var newOptions = _.extend({}, options, {
                        to: result.getRelation(fieldName),
                        withRelated: nextRelations ? [nextRelations] : null
                    });
                    delete newOptions.attributes;
                    relation.clone(newOptions);
                }, this);
            }

            result.url = this.url;
            result._query = this._query.clone();
            result._query.instance = result;
            result._loaded = this._loaded;
            if(!result._parentRelation) {
                result._parentRelation = _.clone(this._parentRelation);
            }
            result.set(options.attributes);
            result._isDirty = this._isDirty;

            return result;
        },

        parse: function(response, options) {
            var result = {};
            var field, fieldName, relation, cache;
            var relationOptions = _.extend({}, options, {parse: false});
            var isDirty;

            for(fieldName in this.fields) {
                if(this.fields.hasOwnProperty(fieldName)) {
                    field = this.fields[fieldName];
                    
                    if(response.hasOwnProperty(fieldName)) {
                        result[fieldName] = field.parse(response[fieldName]);
                    }
                }
            }

            //set the id now since we need this.url() to
            //generate valid urls for getRelation().
            this.id = result.id;


            for(fieldName in this.relatedFields) {
                if(this.relatedFields.hasOwnProperty(fieldName)) {
                    field = this.relatedFields[fieldName];
                    if(response.hasOwnProperty(fieldName)) {
                        relation = this.getRelation(fieldName, result);
                        if(response[fieldName].meta.loaded) {
                            if(field.many) {
                                relation.reset(
                                        relation.parse(response[fieldName], relationOptions),
                                        relationOptions);
                            } else {
                                relation.set(
                                        relation.parse(response[fieldName], relationOptions),
                                        relationOptions);
                            }
                        
                        //update meta info for related fields if method
                        //is not and update (PUT)
                        } else if(options.method !== 'update'){
                            if(field.many) {
                                relation.meta = response[fieldName].meta;
                            } else {
                                //preserve dirty flag
                                isDirty = relation._isDirty;
                                relation.set_meta(response[fieldName].meta);
                                relation._isDirty = isDirty;
                            }
                        }
                    }
                }
            }

            this._isDirty = false;
            this._loaded = this.key();
            
            if(this.session && !options.noSession) {
                this.session.putModel(this.clone({attributes: result}));
            }

            return result;
        },

        toJSON: function(options) {
            var result = {};
            var field, fieldName, relation;
            options = options || {};

            for(fieldName in this.fields) {
                if(this.fields.hasOwnProperty(fieldName)) {
                    field = this.fields[fieldName];
                    result[fieldName] = field.toJSON(this.get(fieldName));
                }
            }
            
            if(options.withRelated) {
                _.each(options.withRelated, function(relations) {
                    relations = relations.split('__');
                    var fieldName = _.first(relations);
                    var field = this.relatedFields[fieldName];
                    var relation = this.getRelation(fieldName);
                    var nextRelations = _.rest(relations).join('__');
                    var newOptions = _.extend({}, options, {
                        withRelated: nextRelations ? [nextRelations] : null
                    });
                    result[fieldName] = relation.toJSON(newOptions);
                }, this);
            }

            return result;
        },
        
        sync: api_utils.sync,

        query: function() {
            return this._query;
        },

        setQuery: function(query) {
            this._query = query;
            this._query.instance = this;
        },

        filterBy: function(filters) {
            return this._query.filterBy(filters);
        },

        withRelated: function() {
            this._query.withRelated.apply(this._query, arguments);
            return this;
        },

        chain: function() {
            return this._query.chain.apply(this._query, arguments);
        },

        fetchFromSession: function(options) {
            var result = false;
            var fetch, model;
            var loadedEvents = 'loaded loaded:read';
            var withRelated;
            options = options || {};

            if(this._query) {
                withRelated = this._query.state.withRelations().pluck('value');
            }

            var triggerFetchEvents = function(model) {

                if(withRelated) {
                    model.eachRelated(withRelated, function(current) {
                        current.instance.trigger(loadedEvents, current.instance);
                    });
                }
                
                model.trigger(loadedEvents, model);
                if(_.isFunction(options.success)) {
                    options.success(model, null, options);
                }
            };

            if(this.session && !options.noSession) {

                model = this.session.getModel(this.key(), this._query);

                if(model) {
                    model.clone({
                        to: this,
                        withRelated: withRelated
                    });

                    triggerFetchEvents(this);
                    result = true;
                } else {
                    fetch = this.session.getFetch(this.key(), this._query);
                    if(fetch) {
                        var that = this;
                        fetch.success.push(function(instance, response) {
                            instance.clone({ to: that });
                            triggerFetchEvents(that);
                        });
                        result = true;
                    } else {
                        this.session.putFetch(this, this.key(), this._query);
                    }
                }
            }

            return result;
        },

        fetch: function(options) {
            options = _.extend({
                data: {},
                query: this._query
            }, options);
            this.setQuery(options.query);

            _.extend(options.data, this._query.toUriObject());
            var handled = this.fetchFromSession(options);
            if(!handled) {
                Backbone.Model.prototype.fetch.call(this, options);
            }
        },
        
        save: function(key, value, options) {
            var success, attributes = {};
            if(key === null || key === undefined || typeof key === 'object') {
                attributes = key;
                options = value || {};
            } else {
                attributes = {};
                attributes[key] = value;
                options = options || {};
            }

            if(this.session) {
                success = options.success;
                options.success = _.bind(function() {
                    this.session.removeAllCollections(
                        new this.collectionConstructor());
                    if(success) {
                        success.apply(this, arguments);
                    }
                }, this);
            }
            return Backbone.Model.prototype.save.call(this, attributes, options);
        },

        destroy: function(options) {
            var success;
            options = options || {};

            if(this.session && !this.isNew()) {
                success = options.success;
                options.success = _.bind(function() {
                    this.session.removeAllCollections(
                        new this.collectionConstructor());
                    if(success) {
                        success.apply(this, arguments);
                    }
                }, this);
            }
            return Backbone.Model.prototype.destroy.call(this, options);
        }

    }, {

        key: function(id, query) {
            var baseUrl = core.base.getValue(this.prototype, 'baseUrl');
            var urlRoot = core.base.getValue(this.prototype, 'urlRoot');
            var result = baseUrl + urlRoot + '/' + encodeURIComponent(id);

            //append query
            //Note that toUri() by default will not include with
            //relations. This is critical since the key should
            //reflect the state of this object and its data
            //and should not change just because the  withRelated
            //args happen to change.
            if(query && query.toUri()) {
                result += '?' + query.toUri();
            }
            return result;
        }
    });

    ApiModel.extend = function(protoProps, classProps) {
        var child = Backbone.Model.extend.apply(this, arguments);
        var fieldMap = child.prototype.fields;
        var fieldName;

        fieldMap.meta = new api_fields.DictField();
        
        defaults = {};
        for(fieldName in fieldMap) {
            if(fieldMap.hasOwnProperty(fieldName)) {
                field = fieldMap[fieldName];
                if(field instanceof(api_fields.Field)) {
                    field.contribute(child, fieldName);
                    
                    if(field.primaryKey) {
                        child.prototype.idAttribute = fieldName;
                    }

                    defaults[fieldName] = core.base.getValue(field, "defaultValue");
                }
            }
        }

        child.prototype.defaults = defaults;
        
        if(!child.prototype.hasOwnProperty("relatedFields")) {
            child.prototype.relatedFields = {};
        }

        fieldMap = child.prototype.relatedFields;
        for(fieldName in fieldMap) {
            if(fieldMap.hasOwnProperty(fieldName)) {
                field = fieldMap[fieldName];
                if(field instanceof(api_fields.Field)) {
                    field.contribute(child, fieldName);
                }
            }
        }
        return child;
    };

    /**
     * ApiCollection
     * @constructor
     * @param {Array} models
     * @param {Object} options
     */
    var ApiCollection = Backbone.Collection.extend({

        constructor: function(models, options) {
            options = options || {};

            Backbone.Collection.prototype.constructor.call(this, models, options);
            
            this.meta = {};
            this._facets = new api_facet.FacetCollection();
            this._parentRelation = null;
            this._loading = false;
            this._loaded = undefined;

            if(options.session ||
              (!options.noSession && api_config.defaultSession)) {
                this.session = api_session.ApiSession.get(
                    options.session || api_config.defaultSession);
            }

            if(!options.query) {
                options.query = new api_query.ApiQuery({
                    collection: this
                });
            }
            this.setQuery(options.query);

            //for save()
            this.toDestroy = [];
            this.bind('remove', this.onRemove, this);
        },

        baseUrl: "/api/v1",

        url: function() {
            var result, parent, field;
            var baseUrl = core.base.getValue(this, 'baseUrl');
            var urlRoot = core.base.getValue(this, 'urlRoot');
         
            if(this.meta.resource_uri) {
                result = this.meta.resource_uri;
            }
            else if(this._parentRelation) {
                parent = this._parentRelation.instance;
                field = this._parentRelation.field;
                result = core.base.getValue(parent, 'url') + '/' + encodeURIComponent(field.name);
            } else {
                result = baseUrl + urlRoot;
            }
            return result;
        },

        key: function() {
            var result;
            if(this.meta.resource_uri) {
                result = this.meta.resource_uri;
            } else {
                result = core.base.getValue(this, 'url');
            }

            //append query
            //Note that toUri() by default will not include with
            //relations. This is critical since the key should
            //reflect the state of this object and its data
            //and should not change just because the  withRelated
            //args happen to change.
            if(this.query().toUri()) {
                result += '?' + this.query().toUri();
            }
            return result;
        },

        model: function(attributes, options) {
            var result;
            var constructor = this.modelConstructor();

            if(this.session && attributes.id) {
                result = this.session.getModel(
                        constructor.key(attributes.id));
            }

            if(!result) {
                result = new constructor(attributes, options);
            }

            return result;
        },

        isLoading: function() {
            return this._loading;
        },

        isLoaded: function() {
            return this._loaded === this.key();
        },

        isLoadable: function() {
            return true;
        },

        isLoadedWith: api_utils.isLoadedWith,

        eachRelated: api_utils.eachRelated,

        bfsRelated: api_utils.bfsRelated,

        dfsRelated: api_utils.dfsRelated,

        getParentRelation: function() {
            var result = null;
            if(_.isObject(this._parentRelation)) {
                result = this._parentRelation.instnace;
            }
            return relation;
        },

        getFacets: function() {
            return this._facets;
        },

        clone: function(options) {
            options = _.extend({
                    models: this.models
            }, options);

            var result = options.to ||  new this.constructor();
            if(result === this) {
                return result;
            }

            var models = _.map(options.models, function(model) {
                return model.clone({
                    withRelated: options.withRelated
                });
            });

            result.meta = _.clone(this.meta);
            result.toDestroy = _.clone(this.toDestroy);
            result.url = this.url;
            this._query.clone({to: result._query});
            result._query.instance = result;
            result._loaded = this._loaded;
            if(!result.parentRelation) {
                result._parentRelation = _.clone(this._parentRelation);
            }
            result._facets.reset(this._facets.clone().models);
            result.reset(models);

            return result;
        },

        parse: function(response, options) {
            var result = [], cache;
            var i;
            options = options || {};

            for(i = 0; i<response.results.length; i++) {
                var model = this.model({
                    id: response.results[i].id
                });
                model._loading = this._loading;
                model.set(model.parse(response.results[i], options), options);
                model._loading = false;
                result.push(model);
            }
            
            this.meta = response.meta;
            this._facets.reset(this._facets.parse(response.meta.facets));
            this._loaded = this.key();
            
            if(this.session && !options.noSession) {
                this.session.putCollection(
                        this.clone({models: result}),
                        this.key(),
                        this._query);
            }

            return result;
        },

        sync: api_utils.sync,

        query: function() {
            return this._query;
        },

        setQuery: function(query) {
            this._query = query;
            this._query.instance = this;
        },

        filterBy: function(filters) {
            this._query.filterBy(filters);
            return this;
        },

        withRelated: function() {
            this._query.withRelated.apply(this._query, arguments);
            return this;
        },

        orderBy: function() {
            this._query.orderBy.apply(this._query, arguments);
            return this;
        },

        slice: function(start, end) {
            this._query.slice(start, end);
            return this;
        },

        chain: function() {
            return this._query.chain.apply(this._query, arguments);
        },

        fetchFromSession: function(options) {
            var result = false;
            var fetch, collection;
            var loadedEvents = 'loaded loaded:read';
            options = options || {};

            var triggerFetchEvents = function(collection) {
                collection.trigger(loadedEvents, collection);
                if(_.isFunction(options.success)) {
                    options.success(collection, null, options);
                }
            };
            
            if(this.session && !options.noSession) {
                collection = this.session.getCollection(this.key(), this._query);
                if(collection) {
                    collection.clone({ to: this });
                    triggerFetchEvents(collection);
                    result = true;
                } else {
                    fetch = this.session.getFetch(this.key(), this._query);
                    if(fetch) {
                        var that = this;
                        fetch.success.push(function(instance, response, options) {
                            instance.clone({ to: that });
                            triggerFetchEvents(that);
                        });
                        result = true;
                    } else {
                        this.session.putFetch(this, this.key(), this._query);
                    }

                }
            }

            return result;
        },

        fetch: function(options) {
            options = _.extend({
                data: {},
                query: this._query
            }, options);
            options.query = this._query;
            this.setQuery(options.query);
            _.extend(options.data, this._query.toUriObject());
            
            var handled = this.fetchFromSession(options);
            if(!handled) {
                Backbone.Collection.prototype.fetch.call(this, options);
            }
        },

        save: function(options) {
            var openRequests = 0;
            var errors = 0;
            var that = this;
            options = _.extend({
                wait: false
            }, options);

            var syncSuccess = function(model, response, opts) {
                openRequests--;
                if(opts.method === 'delete') {
                    that.toDestroy = _.filter(that.toDestroy, function(m) {
                        return m.id !== model.id;
                    });
                }
                if(openRequests === 0) {
                    if(that.session && !options.noSession) {
                        that.session.putCollection(
                                that,
                                that.key(),
                                that._query);
                    }

                    if(errors > 0 && options.error) {
                        options.error(that);
                    } else if(errors === 0 && options.success) {
                        options.success(that);

                    }
                }
            };

            var syncError = function() {
                openRequests--;
                errors++;
                if(openRequests === 0) {
                    if(that.session && !options.noSession) {
                        that.session.removeCollection(
                                that,
                                that.key(),
                                that._query);
                    }

                    if(options.error) {
                        options.error(that);
                    }
                }
            };


            //destroy models with id's which have been removed from
            _.each(this.toDestroy, function(model) {
                if(!this.get(model.id)) {
                    openRequests++;
                    model.destroy({
                        wait: options.wait,
                        success: syncSuccess,
                        error: syncError
                    });
                }
            }, this);
            
            //create or update all models currently in collection
            this.each(function(model) {
                // Don't resave a model that's in the process of loading
                if(model.isLoading()) {
                    return;
                }
                if(model.isNew() || model.isDirty()) {
                    openRequests++;
                    model.save(null, {
                        wait: options.wait,
                        success: syncSuccess,
                        error: syncError
                    });
                }
            });

            //if no saving is needed still trigger success callback
            if(openRequests === 0 && options.success) {
                options.success(this);
            }
        },

        onRemove: function(model) {
            if(model.id) {
                var models = _.where(this.toDestroy, {id: model.id});
                if(models.length === 0) {
                    this.toDestroy.push(model);
                }
            }
        }


    }, {

        key: function(query) {
            var baseUrl = core.base.getValue(this.prototype, 'baseUrl');
            var urlRoot = core.base.getValue(this.prototype, 'urlRoot');
            var result = baseUrl + urlRoot;

            //append query
            //Note that toUri() by default will not include with
            //relations. This is critical since the key should
            //reflect the state of this object and its data
            //and should not change just because the  withRelated
            //args happen to change.
            if(query && query.toUri()) {
                result += '?' + query.toUri();
            }
            return result;
        }
    });

    return {
        ApiCollection: ApiCollection,
        ApiModel: ApiModel
    };
});
