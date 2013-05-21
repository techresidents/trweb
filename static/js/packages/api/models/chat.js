define([
    'jquery',
    'underscore',
    '../base',
    '../fields',
    './topic',
    './user'

], function(
    $,
    _,
    api,
    fields,
    topic_models,
    user_models) {

    var ChatCollection = api.ApiCollection.extend({

        urlRoot: "/chats",

        modelConstructor: function() {
            return Chat;
        }
    });

    var Chat = api.ApiModel.extend({

        urlRoot: "/chats",

        collectionConstructor: ChatCollection,
        
        fields: {
            id: new fields.StringField({primaryKey: true}),
            topic_id: new fields.StringField(),
            start: new fields.DateTimeField({nullable: true}),
            end: new fields.DateTimeField({nullable: true}),
            max_participants: new fields.IntegerField(),
            no_participants: new fields.IntegerField({nullable: true})
        },
        
        relatedFields: {
            topic: new fields.ForeignKey({
                relation: topic_models.Topic
            }),
            users: new fields.ManyToMany({
                relation: user_models.User,
                backref: "chats"
            })
        }
    });

    return {
        Chat: Chat,
        ChatCollection: ChatCollection
    };
});
