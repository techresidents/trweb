define([
    'jquery',
    'underscore',
    'core/base',
    'api/fields'
], function(
    $,
    _,
    base,
    fields) {

    var ApiStruct = base.Base.extend({
        
        initialize: function(attributes) {
            this.set(attributes);
        },

        getRelation: function(fieldName) {
            var field = this.relatedFields[fieldName];
            return this[field.getterName]();
        },

        set: function(attributes) {
            this.attributes = this.validate(attributes);
        },

        validate: function(attributes) {
            var result = {};
            var name, field;
            attributes = attributes || {};

            for(name in attributes) {
                if(attributes.hasOwnProperty(name)) {
                    if(this.fields.hasOwnProperty(name)) {
                        field = this.fields[name];
                    } else if(this.relatedFields.hasOwnProperty(name)) {
                        field = this.relatedFields[name];
                    } else {
                        throw new Error(name + ": invalid field");
                    }

                    result[name] = field.validate(attributes[name]);
                }
            }

            return result;
        },

        parse: function(response) {
            var result = {};
            var field, fieldName;

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
                        var relation = this.getRelation(fieldName);
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

        toJSON: function() {
            var result = {};
            var field, fieldName;

            for(fieldName in this.fields) {
                if(this.fields.hasOwnProperty(fieldName)) {
                    field = this.fields[fieldName];
                    result[fieldName] = field.toJSON(this.attributes[fieldName]);
                }
            }

            return result;
        }
    });

    ApiStruct.extend = function(protoProps, classProps) {
        var child = base.Base.extend.apply(this, arguments);
        var fieldMap = child.prototype.fields;
        var fieldName;

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

    return {
        ApiStruct: ApiStruct
    };
});
