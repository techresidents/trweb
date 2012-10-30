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

        model: function(attributes, options) {
            return new Chat(attributes, options);
        }
    });

    var Chat = api.ApiModel.extend({

        urlRoot: "/chats",

        collectionConstructor: ChatCollection,
        
        fields: {
            id: new fields.StringField({primaryKey: true}),
            start: new fields.DateTimeField({nullable: true})
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
