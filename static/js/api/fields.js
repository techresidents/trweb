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
        },

        parse: function(value) {
            return value;
        },

        toJSON: function(value) {
            return value;
        }

    });

    var BooleanField = Field.extend({
        
    });

    var DateField = Field.extend({
        
    });

    var DateTimeField = Field.extend({
        
    });

    var FloatField = Field.extend({
        
    });

    var IntegerField = Field.extend({
        
    });

    var StringField = Field.extend({
        
    });

    var TimestampField = Field.extend({
        
    });

    var DictField = Field.extend({
        
    });

    var ListField = Field.extend({
        
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
        DateTimeFIeld: DateTimeField,
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
