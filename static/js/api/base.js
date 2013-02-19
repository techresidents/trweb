define([
    'jquery',
    'underscore',
    'backbone',
    'core/base',
    'xd/xd',
    'xd/backbone',
    'api/config',
    'api/fields',
    'api/query',
    'api/session',
    'api/utils'
], function(
    $,
    _,
    Backbone,
    base,
    xd,
    xdBackbone,
    api_config,
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
            
            //if using session and being constructed with id
            //check the cache to see if we already have the model.
            //Note that the session will returned a cloned model
            //so no need to worry side effects.
            if(this.session && attributes.id) {
                model = this.session.getModel(
                    this.constructor.key(attributes.id));
            }
            
            //if the model is not in cache proceed with construction
            if(!model) {
                attributes.meta = {
                    "resource_name": base.getValue(this, "urlRoot").substring(1),
                    "resource_uri": null
                };

                Backbone.Model.prototype.constructor.call(this, attributes, options);
                
                this._loading = false;
                this._loaded = false;
                this._isDirty = false;

                this.bind('change', function() {
                    this._isDirty = true;
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
            var url = Backbone.Model.prototype.url.apply(this, arguments);
            url = this.baseUrl + url;
            return url;
        },

        key: function() {
            var result;
            var meta = this.get_meta();
            if(meta.resource_uri) {
                result = meta.resource_uri;
            } else {
                result = base.getValue(this, 'url'); 
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
            return this._loaded;
        },

        isLoadable: function() {
            return !this.isNew();
        },

        isLoadedWith: api_utils.isLoadedWith,
            
        bfsRelated: api_utils.bfsRelated,

        dfsRelated: api_utils.dfsRelated,

        eachRelated: api_utils.eachRelated,

        getRelation: function(fieldName, attributes) {
            var field = this.relatedFields[fieldName];
            return this[field.getterName](attributes);
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
            result.set(options.attributes);
            result.url = this.url;
            result._loaded = this._loaded;
            result._isDirty = this._isDirty;

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

            return result;
        },

        parse: function(response, options) {
            var result = {};
            var field, fieldName, relation, cache;
            var relationOptions = _.extend({}, options, {parse: false});

            for(fieldName in this.fields) {
                if(this.fields.hasOwnProperty(fieldName)) {
                    field = this.fields[fieldName];
                    
                    if(response.hasOwnProperty(fieldName)) {
                        result[fieldName] = field.parse(response[fieldName]);
                        
                        //update url if possible
                        if(fieldName === 'meta' && response.meta.resource_uri) {
                            this.url = response.meta.resource_uri;
                        }
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

                        } else {
                            relation.url = response[fieldName].meta.resource_uri;
                        }
                    }
                }
            }
            
            this._isDirty = false;
            this._loaded = true;
            
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
            return new api_query.ApiQuery({model: this});
        },

        filterBy: function(filters) {
            return new api_query.ApiQuery({model: this}).filterBy(filters);
        },

        withRelated: function() {
            var query = new api_query.ApiQuery({model: this});
            return query.withRelated.apply(query, arguments);
        },

        fetchFromSession: function(options) {
            var result = false;
            var fetch, model;
            options = options || {};

            var triggerFetchEvents = function(model) {
                var withRelated;
                if(options.query) {
                    withRelated = options.query.state.withRelations().pluck('value');
                }

                if(withRelated) {
                    model.eachRelated(withRelated, function(current) {
                        current.instance.trigger('loaded', current.instance);
                    });
                }
                
                model.trigger('loaded', model);
                if(_.isFunction(options.success)) {
                    options.success(model, null, options);
                }
            };

            if(this.session && !options.noSession) {

                model = this.session.getModel(this.key(), options.query);

                if(model) {
                    result.clone({
                        to: this,
                        withRelated: withRelated
                    });

                    triggerFetchEvents(this);
                    result = true;
                } else {
                    fetch = this.session.getFetch(this.key(), options.query);
                    if(fetch) {
                        var that = this;
                        fetch.success.push(function(instance, response) {
                            instance.clone({ to: that });
                            triggerFetchEvents(that);
                        });
                        result = true;
                    } else {
                        this.session.putFetch(this, this.key(), options.query);
                    }
                }
            }

            return result;
        },

        fetch: function(options) {
            var handled = this.fetchFromSession(options);
            if(!handled) {
                Backbone.Model.prototype.fetch.call(this, options);
            }
        },

        save: function(key, value, options) {
            if(this.session && this.isNew() && this.collection) {
                this.session.removeCollection(this.collection);
            }
            return Backbone.Model.prototype.save.call(this, key, value, options);
        },

        destroy: function(options) {
            if(this.session && !this.isNew() && this.collection) {
                this.session.removeCollection(this.collection);
            }
            return Backbone.Model.prototype.destroy.call(this, options);
        }

    }, {

        key: function(id) {
            return this.prototype.url() + '/' + id;
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

                    defaults[fieldName] = base.getValue(field, "defaultValue");
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
            this._loading = false;
            this._loaded = false;
        
            if(options.session ||
              (!options.noSession && api_config.defaultSession)) {
                this.session = api_session.ApiSession.get(
                    options.session || api_config.defaultSession);
            }

            //for save()
            this.toDestroy = [];
            this.bind('remove', this.onRemove, this);
        },

        baseUrl: "/api/v1",

        url: function() {
            url = this.baseUrl + base.getValue(this, "urlRoot");
            return url;
        },

        key: function() {
            var result;
            if(this.meta.resource_uri) {
                result = this.meta.resource_uri;
            } else {
                result = base.getValue(this, 'url');
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
            return this._loaded;
        },

        isLoadable: function() {
            return true;
        },

        isLoadedWith: api_utils.isLoadedWith,

        eachRelated: api_utils.eachRelated,

        bfsRelated: api_utils.bfsRelated,

        dfsRelated: api_utils.dfsRelated,

        clone: function(options) {
            options = _.extend({
                    models: this.models
            }, options);

            var result = options.to ||  new this.constructor();
            result.reset(_.map(options.models, function(model) {
                return model.clone({
                    withRelated: options.withRelated
                });
            }));
            
            result.meta = _.clone(this.meta);
            result.url = this.url;
            result._loaded = this._loaded;

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
                model.set(model.parse(response.results[i], options), options);
                result.push(model);
            }

            this.meta = response.meta;
            if(this.meta && this.meta.resource_uri) {
                this.url = this.meta.resource_uri;
            }
            this._loaded = true;

            if(this.session && !options.noSession) {
                this.session.putCollection(
                        this.clone({models: result}),
                        this.key(),
                        options.query);
            }

            return result;
        },

        sync: api_utils.sync,

        query: function() {
            return new api_query.ApiQuery({collection: this});
        },

        filterBy: function(filters) {
            return new api_query.ApiQuery({collection: this}).filterBy(filters);
        },

        withRelated: function() {
            var query = new api_query.ApiQuery({collection: this});
            return query.withRelated.apply(query, arguments);
        },

        orderBy: function() {
            var query = new api_query.ApiQuery({collection: this});
            return query.orderBy.apply(query, arguments);
        },

        slice: function(start, end) {
            return new api_query.ApiQuery({collection: this}).slice(start, end);
        },

        fetchFromSession: function(options) {
            var result = false;
            var fetch, collection;
            options = options || {};
            
            if(this.session && !options.noSession) {
                collection = this.session.getCollection(this.key(), options.query);
                if(collection) {
                    collection.clone({ to: this });
                    this.trigger('loaded', this);
                    if(_.isFunction(options.success)) {
                        options.success(this, null, options);
                    }
                    result = true;
                } else {
                    fetch = this.session.getFetch(this.key(), options.query);
                    if(fetch) {
                        var that = this;
                        fetch.success.push(function(instance, response, options) {
                            instance.clone({ to: that });
                            that.trigger('loaded', that);
                        });
                        result = true;
                    } else {
                        this.session.putFetch(this, this.key(), options.query);
                    }

                }
            }

            return result;
        },

        fetch: function(options) {
            var handled = this.fetchFromSession(options);

            if(!handled) {
                Backbone.Collection.prototype.fetch.call(this, options);
            }
        },

        save: function(options) {
            var openRequests = 0;
            var errors = 0;
            var that = this;
            var test = this;
            options = options || {};

            var syncSuccess = function() {
                openRequests--;
                if(openRequests === 0) {

                    if(that.session && !options.noSession) {
                        that.session.putCollection(
                                that,
                                that.key(),
                                options.query);
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
                                options.query);
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
                        success: syncSuccess,
                        error: syncError
                    });
                }
            }, this);
            
            //create or update all models currently in collection
            this.each(function(model) {
                if(model.isNew() || model.isDirty()) {
                    openRequests++;
                    model.save(null, {
                        success: syncSuccess,
                        error: syncError
                    });
                }
            });
            this.toDestroy = [];
            

            //if no saving is needed still trigger success callback
            if(openRequests === 0 && options.success) {
                options.success(this);
            }
        },

        onRemove: function(model) {
            if(model.id) {
                this.toDestroy.push(model);
            }
        }


    }, {

        key: function(query) {
            return this.prototype.url();
        }
    });

    return {
        ApiCollection: ApiCollection,
        ApiModel: ApiModel
    };
});
