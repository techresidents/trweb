define([
    'jquery',
    'underscore',
    'api/base',
    'api/fields',
    'api/models/chat_minute',
    'api/models/chat_session',
    'api/models/user'

], function(
    $,
    _,
    api,
    fields,
    chat_minute_models,
    chat_session_models,
    user_models) {

    var ChatTagCollection = api.ApiCollection.extend({

        urlRoot: "/chat_tags",

        model: function(attributes, options) {
            return new ChatTag(attributes, options);
        }
    });

    var ChatTag = api.ApiModel.extend({

        urlRoot: "/chat_tags",

        collectionConstructor: ChatTagCollection,
        
        fields: {
            id: new fields.StringField({primaryKey: true}),
            user_id: new fields.IntegerField(),
            chat_minute_id: new fields.IntegerField(),
            chat_session_id: new fields.StringField(),
            time: new fields.DateTimeField(),
            name: new fields.StringField()
        },
        
        relatedFields: {
            user: new fields.ForeignKey({
                relation: user_models.User
            }),

            chat_minute: new fields.ForeignKey({
                relation: chat_minute_models.ChatMinute,
                backref: "chat_tags"
            }),

            chat_session: new fields.ForeignKey({
                relation: chat_session_models.ChatSession,
                backref: "chat_tags"
            })
        }
    });

    return {
        ChatTag: ChatTag,
        ChatTagCollection: ChatTagCollection
    };
});
