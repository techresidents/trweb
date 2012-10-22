define([
    'jQuery',
    'Underscore',
    'core/base'
], function(
    $,
    _,
    base) {
    
    var Field = base.Base.extend({
        defaults: {
            name: null,
            primaryKey: false,
            nullable: false,
            defaultValue: null,
            getterName: null,
            setterName: null
        },

        initialize: function(attributes) {
            var key;
            var defaults = base.getValue(this, 'defaults');
            _.extend(this, defaults);
            
            if(attributes) {
                for(key in defaults) {
                    if(defaults.hasOwnProperty(key) &&
                       attributes.hasOwnProperty(key)) {
                        this[key] = attributes[key];
                    }
                }
            }
        },

        contribute: function(constructor, fieldName) {
            this.name = fieldName;

            var getter = function() {
                //'this' will resolve to constructor instance
                return this.get(fieldName);
            };

            var setter = function(value, options) {
                attributes = {};
                attributes[fieldName] = value;
                //'this' will resolve to constructor instance
                return this.set(attributes, options);
            };
            
            var capitalizedFieldName = fieldName.charAt(0).toUpperCase() + fieldName.substring(1);
            this.getterName = "get" + capitalizedFieldName;
            this.setterName = "set" + capitalizedFieldName;

            constructor.prototype[this.getterName] = getter;
            constructor.prototype[this.setterName] = setter;
        },

        validate: function(value) {
            var result = this.parse(value);
            if(!this.primaryKey
               && !this.nullable
               && (_.isNull(result) || _.isUndefined(result))) {
                throw new Error(this.name + ": cannot be null");
            }
            return result;
        },

        parse: function(value) {
            var result;
            if(_.isNull(value) || _.isUndefined(value)) {
                result = null;
            } else {
                result = value;
            }
            return result;
        },

        toJSON: function(value) {
            return value;
        }

    });

    var BooleanField = Field.extend({
        parse: function(value) {
            var result;
            if(_.isNull(value) || _.isUndefined(value)) {
                result = null;
            }
            else if(_.isBoolean(value)) {
                result = value;
            }else if(_.isString(value)) {
                switch(value.toLowerCase()) {
                    case 'true':
                    case 't':
                        value = true;
                        break;
                    case 'false':
                    case 'f':
                        value = false;
                        break;
                    default:
                        throw new Error(this.name + ": invalid boolean");
                }
            } else {
                throw new Error(this.name + ": invalid boolean");
            }
            return value;
        }
    });

    var DateField = Field.extend({
        parse: function(value) {
            var result;
            if(_.isNull(value) || _.isUndefined(value)) {
                result = null;
            }
            else if(_.isString(value)) {
                result = new Date(value);
            } else if(_.isDate(value)) {
                result = value;
            } else {
                throw new Error(this.name + ": invalid date");
            }
            return result;
        },

        toJSON: function(value) {
            var result;
            if(_.isDate(value)) {
                result = value.toISOString().substring(0,10);
            } else {
                throw new Error(this.name + ": invalid date");
            }
            return result;
        }
    });

    var DateTimeField = Field.extend({
        parse: function(value) {
            var result;
            if(_.isNull(value) || _.isUndefined(value)) {
                result = null;
            }
            else if(_.isNumber(value)) {
                result = new Date(0);
                result.setUTCSeconds(value);
            } else if(_.isDate(value)) {
                result = value;
            } else {
                throw new Error(this.name + ":invalid datetime");
            }
            return result;
        },

        toJSON: function(value) {
            var result;
            if(_.isDate(value)) {
                result = value.getTime()/1000.0;
            } else {
                throw new Error(this.name + ": invalid datetime");
            }
            return result;
        }
    });

    var FloatField = Field.extend({
        parse: function(value) {
            var result;
            if(_.isNull(value) || _.isUndefined(value)) {
                result = null;
            }
            else if(_.isNumber(value)) {
                result = value;
            } else if(_.isString(value)) {
                result = parseFloat(value);
            } else {
                throw new Error(this.name + ":invalid float");
            }
            return result;
        }
    });

    var IntegerField = Field.extend({
        parse: function(value) {
            var result;
            if(_.isNull(value) || _.isUndefined(value)) {
                result = null;
            }
            else if(_.isNumber(value)) {
                result = Math.floor(value);
            } else if(_.isString(value)) {
                result = parseInt(value, 10);
            } else {
                throw new Error(this.name + ":invalid integer");
            }
            return result;
        }
    });

    var StringField = Field.extend({
        parse: function(value) {
            var result;
            if(_.isNull(value) || _.isUndefined(value)) {
                result = null;
            }
            else if(_.isString(value)) {
                result = value;
            } else {
                result = value.toString();
            }
            return result;
        }
        
    });

    var TimestampField = FloatField.extend({
    });

    var DictField = Field.extend({
        parse: function(value) {
            var result;
            if(_.isNull(value) || _.isUndefined(value)) {
                result = null;
            }
            else if(_.isObject(value)) {
                result = value;
            } else {
                throw new Error(this.name + ":invalid dict");
            }
            return result;
        }
    });

    var ListField = Field.extend({
        parse: function(value) {
            var result;
            if(_.isNull(value) || _.isUndefined(value)) {
                result = null;
            }
            else if(_.isArray(value)) {
                result = value;
            } else {
                throw new Error(this.name + ":invalid list");
            }
            return result;
        }
    });

    var RelatedField = Field.extend({

        initialize: function(attributes) {
            Field.prototype.initialize(attributes);
            this.relationConstructor = attributes.relation;
            this.many = attributes.many;
            this.selfReferential = false;
        },

        contribute: function(constructor, fieldName) {
            this.name = fieldName;

            //adjust for self-referential models
            if(this.relationConstructor === "self") {
                this.relationConstructor = constructor;
                this.selfReferential = true;
            }
            
            //'that' will resolve to field instance
            var that = this;

            //construct getter which returns relation instance
            var getter = function() {
                var relation;
                var constructorInstance;
                var relationInstanceName = "_" + fieldName;

                //'this' resolves to relationConstructor instance
                if(this[relationInstanceName]) {
                    relation = this[relationInstanceName];
                } else {
                    if(that.many) {
                        relation = new that.relationConstructor.prototype.collectionConstructor();
                    } else {
                        relation = new that.relationConstructor();
                    }
                    
                    constructorInstance = this;
                    relation.url = function() {
                        return constructorInstance.url() + "/" + fieldName;
                    };

                    this[relationInstanceName] = relation;
                }
                return relation;
            };
            
            this.getterName = "get_" + fieldName;
            constructor.prototype[this.getterName] = getter;
        }

    });

    var ReverseForeignKey = RelatedField.extend({
        initialize: function(attributes) {
            attributes.many = true;
            RelatedField.prototype.initialize.call(this, attributes);
        }
    });

    var ForeignKey = RelatedField.extend({
        initialize: function(attributes) {
            attributes.many = false;
            RelatedField.prototype.initialize.call(this, attributes);
            this.backref = attributes.backref;
        },

        contribute: function(constructor, fieldName) {
            RelatedField.prototype.contribute.call(this, constructor, fieldName);
            if(this.backref) {
                var backrefRelation = constructor;

                var field = new ReverseForeignKey({
                    relation: backrefRelation
                });

                this.relationConstructor.prototype.relatedFields[this.backref] = field;
                field.contribute(this.relationConstructor, this.backref);
            }
        }
    });

    var ManyToMany = RelatedField.extend({
        initialize: function(attributes) {
            attributes.many = true;
            RelatedField.prototype.initialize.call(this, attributes);
            this.backref = attributes.backref;
        },

        contribute: function(constructor, fieldName) {
            RelatedField.prototype.contribute.call(this, constructor, fieldName);
            if(this.backref) {
                var backrefRelation = constructor;

                var field = new ManyToMany({
                    relation: backrefRelation
                });

                this.relationConstructor.prototype.relatedFields[this.backref] = field;
                field.contribute(this.relationConstructor, this.backref);
            }
        }
    });


    return {
        Field: Field,
        BooleanField: BooleanField,
        DateField: DateField,
        DateTimeField: DateTimeField,
        FloatField: FloatField,
        IntegerField: IntegerField,
        StringField: StringField,
        TimestampField: TimestampField,
        DictField: DictField,
        ListField: ListField,
        RelatedField: RelatedField,
        ForeignKey: ForeignKey,
        ReverseForeignKey: ReverseForeignKey,
        ManyToMany: ManyToMany
    };
});
