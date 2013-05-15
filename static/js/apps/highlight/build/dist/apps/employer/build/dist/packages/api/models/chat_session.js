define([
    'jquery',
    'underscore',
    '../base',
    '../fields',
    './chat',
    './user'

], function(
    $,
    _,
    api,
    fields,
    chat_models,
    user_models) {

    var ChatSessionCollection = api.ApiCollection.extend({

        urlRoot: "/chat_sessions",

        modelConstructor: function() {
            return ChatSession;
        }
    });

    var ChatSession = api.ApiModel.extend({

        urlRoot: "/chat_sessions",

        collectionConstructor: ChatSessionCollection,
        
        fields: {
            id: new fields.StringField({primaryKey: true}),
            chat_id: new fields.StringField(),
            connect: new fields.DateTimeField({nullable: true}),
            publish: new fields.DateTimeField({nullable: true}),
            start: new fields.DateTimeField({nullable: true}),
            end: new fields.DateTimeField({nullable: true}),
            participants: new fields.IntegerField()
        },
        
        relatedFields: {
            users: new fields.ManyToMany({
                relation: user_models.User,
                backref: "chat_sessions"
            }),

            chat: new fields.ForeignKey({
                relation: chat_models.Chat,
                backref: "chat_sessions"
            })
        }

    });

    return {
        ChatSession: ChatSession,
        ChatSessionCollection: ChatSessionCollection
    };
});
