define([
    'jquery',
    'underscore',
    'backbone',
    'core/base',
    'xd/xd',
    'xd/backbone',
    'api/fields',
    'api/session',
    'api/config'
], function(
    $,
    _,
    Backbone,
    base,
    xd,
    xdBackbone,
    api_fields,
    api_session,
    api_config) {

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

        if(this instanceof ApiCollection) {
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
                if(current instanceof ApiCollection) {
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
            this.filters = {};
            this.withRelations = [];
            this.orderBys = [];
            this.slices = [];
        },

        filterBy: function(filters) {
            _.extend(this.filters, filters);
            return this;
        },

        withRelated: function() {
            var i, arg;
            for(i=0; i < arguments.length; i++) {
                arg = arguments[i];
                if(_.isArray(arg)) {
                    if(arg.length) {
                        this.withRelations = this.withRelations.concat(arg);
                    }
                } else {
                    if(arg) {
                        this.withRelations.push(arg);
                    }
                }
            }
            return this;
        },

        orderBys: function() {
            var i, arg;
            for(i=0; i < arguments.length; i++) {
                if(_.isArray(arg)) {
                    if(arg.length) {
                        this.orderBys = this.orderBys.concat(arg);
                    }
                } else {
                    if(arg) {
                        this.orderBys.push(arguments[i]);
                    }
                }
            }
            return this;
        },

        slice: function(start, end) {
            this.slices = [start, end];
            return this;
        },

        fetch: function(options) {
            options = options || {};
            if(!options.hasOwnProperty("data")) {
                options.data = {};
            }

            if(this.filters) {
                _.extend(options.data, this.filters);
            }
            if(this.withRelations.length > 0) {
                options.data['with'] = this.withRelations.join();
            }
            if(this.orderBys.length > 0) {
                options.data.order_by = this.orderBys.join();
            }
            if(this.slices.length > 0) {
                options.data.slice = this.slices.join();
            }
            
            return this.instance.fetch(options);
        }
    });

    
    /**
     * ApiModel
     * @constructor
     * @param {Object} attributes
     * @param {Object} options
     */
    var ApiModel = Backbone.Model.extend({

        constructor: function(attributes, options) {

            attributes = attributes || {};
            options = options || {};

            //configure session if neeed
            if(options.session ||
              (!options.noSession && api_config.defaultSession)) {
                this.session = api_session.ApiSession.get(
                    options.session || api_config.defaultSession);
            }
            
            //TODO 
            //Consider short circuiting creation of model if it already exists
            //in the session. This would only work if the model id was passed
            //to the constructor. The downside of this approach is that clone()
            //would no longer work, and would need to be overriden to pass
            //the 'noSession' option to the constructor.

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
        },

        baseUrl: "/api/v1",

        url: function() {
            var url = Backbone.Model.prototype.url.apply(this, arguments);
            url = this.baseUrl + url;
            return url;
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

        isLoadedWith: isLoadedWith,

        eachRelated: eachRelated,

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

        parse: function(response, options) {
            var result = {};
            var field, fieldName, relation;

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
                        if(field.many && _.isArray(response[fieldName])) {
                            relation.reset(relation.parse(response[fieldName], options), options);
                        }else if(!field.many && _.isObject(response[fieldName])) {
                            relation.set(relation.parse(response[fieldName], options), options);
                        } else {
                            relation.url = response[fieldName];
                        }
                    }
                }
            }
            
            this._loaded = true;
            return result;
        },

        toJSON: function(options) {
            var result = {};
            var field, fieldName, relation;
            options = options || {};
            options.level = options.level || 5;

            for(fieldName in this.fields) {
                if(this.fields.hasOwnProperty(fieldName)) {
                    field = this.fields[fieldName];
                    result[fieldName] = field.toJSON(this.get(fieldName));
                }
            }
            
            if(options.withRelated) {
                for(fieldName in this.relatedFields) {
                    if(this.relatedFields.hasOwnProperty(fieldName)) {
                        field = this.relatedFields[fieldName];
                        relation = this.getRelation(fieldName);
                        if(relation.isLoaded() && options.level > 1) {
                            var newOptions = _.clone(options);
                            newOptions.level -= 1;
                            result[fieldName] = relation.toJSON(newOptions);
                        } else {
                            result[fieldName] = field.many ? [] : {};
                        }
                    }
                }
            }

            return result;
        },
        
        sync: sync,

        filterBy: function(filters) {
            return new ApiQuery({model: this}).filterBy(filters);
        },

        withRelated: function() {
            var query = new ApiQuery({model: this});
            return query.withRelated.apply(query, arguments);
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

        model: function(attributes, options) {
            var result;
            var constructor = this.modelConstructor();
            if(this.session && attributes.id) {
                result = this.session.getModel(constructor, attributes.id);
            } else {
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

        isLoadedWith: isLoadedWith,

        eachRelated: eachRelated,

        parse: function(response, options) {
            var result = [];
            var i;
            for(i = 0; i<response.length; i++) {
                var model = this.model({
                    id: response[i].id
                });
                model.set(model.parse(response[i], options), options);
                result.push(model);
            }
            this._loaded = true;
            return result;
        },

        sync: sync,

        filterBy: function(filters) {
            return new ApiQuery({collection: this}).filterBy(filters);
        },

        withRelated: function() {
            var query = new ApiQuery({collection: this});
            return query.withRelated.apply(query, arguments);
        },

        orderBy: function() {
            var query = new ApiQuery({collection: this});
            return query.orderBy.apply(query, arguments);
        },

        slice: function(start, end) {
            return new ApiQuery({collection: this}).slice(start, end);
        },

        save: function(options) {
            var openRequests = 0;
            var errors = 0;
            var that = this;
            options = options || {};

            var syncSuccess = function() {
                openRequests--;
                if(openRequests === 0) {
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
                    if(options.error) {
                        options.error(that);
                    }
                }
            };

            //destroy models with id's which have been removed from
            //the collection prior to save()
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


    });

    return {
        ApiCollection: ApiCollection,
        ApiModel: ApiModel
    };
});
