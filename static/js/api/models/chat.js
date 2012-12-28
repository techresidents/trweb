define([
    'jquery',
    'underscore',
    'api/base',
    'api/fields',
    'api/models/topic'

], function(
    $,
    _,
    api,
    fields,
    topic_models) {

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
            type: new fields.StringField(),
            start: new fields.DateTimeField({nullable: true}),
            end: new fields.DateTimeField({nullable: true}),
            registration_start: new fields.DateTimeField({nullable: true}),
            registration_end: new fields.DateTimeField({nullable: true}),
            checkin_start: new fields.DateTimeField({nullable: true}),
            checkin_end: new fields.DateTimeField({nullable: true})
        },
        
        relatedFields: {
            topic: new fields.ForeignKey({
                relation: topic_models.Topic
            })
        }
    });

    return {
        Chat: Chat,
        ChatCollection: ChatCollection
    };
});
