define([
    'jQuery',
    'Underscore',
    'api/base',
    'api/fields'
], function(
    $,
    _,
    api,
    fields) {

    var UserCollection = api.ApiCollection.extend({
        urlRoot: "/users",

        model: function(attributes, options) {
            return new User(attributes, options);
        }

    });

    var User = api.ApiModel.extend({
        urlRoot: "/users",

        collectionConstructor: UserCollection,

        fields: {
            id: new fields.IntegerField({primaryKey: true}),
            first_name: new fields.StringField()
        }

    });

    var TopicCollection = api.ApiCollection.extend({

        urlRoot: "/topic",

        model: function(attributes, options) {
            return new Topic(attributes, options);
        }
    });

    var Topic = api.ApiModel.extend({
        
        urlRoot: "/topic",

        collectionConstructor: TopicCollection,
        
        fields: {
            id: new fields.IntegerField({primaryKey: true}),
            title: new fields.StringField(),
            description: new fields.StringField(),
            parent_id: new fields.IntegerField({nullable: true}),
            type_id: new fields.IntegerField({defaultValue: 1}),
            user_id: new fields.IntegerField({nullable: true}),
            rank: new fields.IntegerField(),
            "public": new fields.BooleanField({defaultValue: false}),
            level: new fields.IntegerField({nullable: false}),
            duration: new fields.IntegerField(),
            recommended_participants: new fields.IntegerField()
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

    var ChatCollection = api.ApiCollection.extend({

        urlRoot: "/chat",

        model: function(attributes, options) {
            return new Chat(attributes, options);
        }
    });

    var Chat = api.ApiModel.extend({

        urlRoot: "/chat",

        collectionConstructor: ChatCollection,
        
        fields: {
            id: new fields.StringField({primaryKey: true}),
            start: new fields.DateTimeField({nullable: true})
        },
        
        relatedFields: {
            topic: new fields.ForeignKey({
                relation: Topic
            })
        }
    });

    var ChatSessionCollection = api.ApiCollection.extend({

        urlRoot: "/chat_sessions",

        model: function(attributes, options) {
            return new ChatSession(attributes, options);
        }
    });

    var ChatSession = api.ApiModel.extend({

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

    return {
        Chat: Chat,
        ChatCollection: ChatCollection,
        ChatSession: ChatSession,
        ChatSessionCollection: ChatSessionCollection,
        User: User,
        UserCollection: UserCollection,
        Topic: Topic,
        TopicCollection: TopicCollection
    };
});
