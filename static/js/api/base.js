define([
    'jQuery',
    'Underscore',
    'Backbone',
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
    

    var ApiModel = Backbone.Model.extend({

        constructor: function(options) {
            Backbone.Model.prototype.constructor.apply(this, arguments);
        },
        
        baseUrl: "/api/v1",

        url: function() {
            var url = Backbone.Model.prototype.url.apply(this, arguments);
            url = this.baseUrl + url;
            return url;
        },

        
        getRelation: function(fieldName) {
            var field = this.relatedFields[fieldName];
            return this[field.getterName]();
        },

        parse: function(response) {
            var result = {};
            var field;
            var fieldName;

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
        },

        /**
         * Cross domain compatible sync
         */
        sync: xdBackbone.sync

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

        constructor: function(options) {
            Backbone.Collection.prototype.constructor.apply(this, arguments);
        },

        baseUrl: "/api/v1",

        url: function() {
            var url = Backbone.Collection.prototype.url.apply(this, arguments);
            url = this.baseUrl + url;
            return url;
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
        sync: xdBackbone.sync

    });

    var UserCollection = ApiCollection.extend({
        urlRoot: "/users",

        model: function(attributes, options) {
            return new User(attributes, options);
        }

    });

    var User = ApiModel.extend({
        urlRoot: "/users",

        collectionConstructor: UserCollection,

        fields: {
            id: new fields.IntegerField({primaryKey: true}),
            first_name: new fields.StringField()
        }

    });

    var TopicCollection = ApiCollection.extend({

        urlRoot: "/topic",

        model: function(attributes, options) {
            return new Topic(attributes, options);
        }
    });

    var Topic = ApiModel.extend({
        
        urlRoot: "/topic",

        collectionConstructor: TopicCollection,
        
        fields: {
            id: new fields.IntegerField({primaryKey: true}),
            title: new fields.StringField(),
            parent_id: new fields.IntegerField()
        },
        
        relatedFields: {
            parent: new fields.ForeignKey({
                relation: "self",
                backref: "children"
            }),

            tree: new fields.RelatedField({
                relation: "self",
                many: true
            })
        }

    });

    var ChatCollection = ApiCollection.extend({

        urlRoot: "/chat",

        model: function(attributes, options) {
            return new Chat(attributes, options);
        }
    });

    var Chat = ApiModel.extend({

        urlRoot: "/chat",

        collectionConstructor: ChatCollection,
        
        fields: {
            id: new fields.IntegerField({primaryKey: true})
        },
        
        relatedFields: {
            topic: new fields.ForeignKey({
                relation: Topic
            })
        }
    });

    var ChatSessionCollection = ApiCollection.extend({

        urlRoot: "/chat_sessions",

        model: function(attributes, options) {
            return new ChatSession(attributes, options);
        }
    });

    var ChatSession = ApiModel.extend({

        urlRoot: "/chat_sessions",

        collectionConstructor: ChatSessionCollection,
        
        fields: {
            id: new fields.IntegerField({primaryKey: true})
        },
        
        relatedFields: {
            users: new fields.ManyToMany({
                relation: User,
                backref: "chat_sessions"
            }),

            chatTest: new fields.ForeignKey({
                relation: Chat,
                backref: "chat_sessions"
            })
        }

    });

    
    var session = new ChatSession({id: "18e718g"});

    /*
    session.fetch({
        data: {"with": "chatTest__topic"},
        success: function() {console.log(session.get_chatTest());}
    });
    */
    
    var user = new User({id: 11});
    user.fetch({
        data: {"with": "chat_sessions__chatTest"},
        success: function() {console.log(user);}
    });

    /*
    var session = new ChatSession({id: "18e718g"});
    session.users.fetch({
        success: function() {console.log(session.users);}
    });
    */
    
    /*
    var topic = new Topic({id: 1});
    topic.get_tree().fetch({
        success: function() {console.log(topic);}
    });
    */

    return {
        ApiCollection: ApiCollection,
        ApiModel: ApiModel
    };
});
