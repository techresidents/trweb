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

        isLoadedWith: api_utils.isLoadedWith,

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

        isLoadedWith: api_utils.isLoadedWith,

        eachRelated: api_utils.eachRelated,

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
