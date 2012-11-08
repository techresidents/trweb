define([
    'jquery',
    'underscore',
    'api/base',
    'api/fields',
    'api/models/chat_session',
    'api/models/topic'

], function(
    $,
    _,
    api,
    fields,
    chat_session_models,
    topic_models) {

    var ChatMinuteCollection = api.ApiCollection.extend({

        urlRoot: "/chat_minutes",

        model: function(attributes, options) {
            return new ChatMinute(attributes, options);
        }
    });

    var ChatMinute = api.ApiModel.extend({

        urlRoot: "/chat_minutes",

        collectionConstructor: ChatMinuteCollection,
        
        fields: {
            id: new fields.StringField({primaryKey: true}),
            chat_session_id: new fields.StringField(),
            topic_id: new fields.IntegerField(),
            start: new fields.DateTimeField(),
            end: new fields.DateTimeField()
        },
        
        relatedFields: {
            chat_session: new fields.ForeignKey({
                relation: chat_session_models.ChatSession,
                backref: "chat_minutes"
            }),

            topic: new fields.ForeignKey({
                relation: topic_models.Topic
            })
        }
    });

    return {
        ChatMinute: ChatMinute,
        ChatMinuteCollection: ChatMinuteCollection
    };
});
