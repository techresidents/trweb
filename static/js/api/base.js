define([
    'jquery',
    'underscore',
    'backbone',
    'core/base',
    'xd/xd',
    'xd/backbone',
    'api/fields'
], function(
    $,
    _,
    Backbone,
    base,
    xd,
    xdBackbone,
    fields) {

    var ApiQuery = base.Base.extend({
        initialize: function(options) {
            options = options || {};
            this.instance = options.model || options.collection;
            this.filters = {};
            this.withRelations = [];
            this.orderBys = [];
            this.slices = [];
        },

        filter: function(filters) {
            _.extend(this.filters, filters);
            return this;
        },

        withRelated: function() {
            var i;
            for(i=0; i <arguments.length; i++) {
                this.withRelations.push(arguments[i]);
            }
            return this;
        },

        orderBys: function() {
            var i;
            for(i=0; i <arguments.length; i++) {
                this.orderBys.push(arguments[i]);
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


    var ApiModel = Backbone.Model.extend({

        constructor: function(attributes, options) {
            attributes = attributes || {};
            attributes.meta = {
                "resource_name": base.getValue(this, "urlRoot").substring(1),
                "resource_uri": null
            };
            Backbone.Model.prototype.constructor.call(this, attributes, options);
        },

        baseUrl: "/api/v1",

        url: function() {
            var url = Backbone.Model.prototype.url.apply(this, arguments);
            url = this.baseUrl + url;
            return url;
        },

        isLoaded: function() {
            return this.isValid();
        },

        getRelation: function(fieldName) {
            var field = this.relatedFields[fieldName];
            return this[field.getterName]();
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

        parse: function(response) {
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

            for(fieldName in this.relatedFields) {
                if(this.relatedFields.hasOwnProperty(fieldName)) {
                    field = this.relatedFields[fieldName];
                    if(response.hasOwnProperty(fieldName)) {
                        relation = this.getRelation(fieldName);
                        if(field.many && _.isArray(response[fieldName])) {
                            relation.reset(relation.parse(response[fieldName]));
                        }else if(!field.many && _.isObject(response[fieldName])) {
                            relation.set(relation.parse(response[fieldName]));
                        } else {
                            relation.url = response[fieldName];
                        }
                    }
                }
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
                for(fieldName in this.relatedFields) {
                    if(this.relatedFields.hasOwnProperty(fieldName)) {
                        field = this.relatedFields[fieldName];
                        relation = this.getRelation(fieldName);
                        if(relation.isLoaded()) {
                            result[fieldName] = relation.toJSON(options);
                        } else {
                            result[fieldName] = field.many ? [] : {};
                        }
                    }
                }
            }

            return result;
        },

        /**
         * Cross domain compatible sync
         */
        sync: xdBackbone.sync,

        filter: function(filters) {
            return new ApiQuery({model: this}).filter(filters);
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

        fieldMap.meta = new fields.DictField();
        
        defaults = {};
        for(fieldName in fieldMap) {
            if(fieldMap.hasOwnProperty(fieldName)) {
                field = fieldMap[fieldName];
                if(field instanceof(fields.Field)) {
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
                if(field instanceof(fields.Field)) {
                    field.contribute(child, fieldName);
                }
            }
        }
        return child;
    };

    var ApiCollection = Backbone.Collection.extend({

        constructor: function(models, options) {
            Backbone.Collection.prototype.constructor.apply(this, arguments);
        },

        baseUrl: "/api/v1",

        url: function() {
            url = this.baseUrl + base.getValue(this, "urlRoot");
            return url;
        },

        isLoaded: function() {
            return this.length > 0;
        },

        parse: function(response) {
            var result = [];
            var i;
            for(i = 0; i<response.length; i++) {
                var model = new this.model();
                model.set(model.parse(response[i]));
                result.push(model);

            }
            return result;
        },

        /**
         * Cross domain compatible sync
         */
        sync: xdBackbone.sync,

        filter: function(filters) {
            return new ApiQuery({collection: this}).filter(filters);
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
        }


    });

    return {
        ApiCollection: ApiCollection,
        ApiModel: ApiModel
    };
});
