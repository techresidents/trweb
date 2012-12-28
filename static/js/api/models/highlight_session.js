define([
    'jquery',
    'underscore',
    'api/base',
    'api/fields',
    'api/models/user',
    'api/models/chat_session'
], function(
    $,
    _,
    api,
    fields,
    user_models,
    chat_session_models) {

    var HighlightSessionCollection = api.ApiCollection.extend({
        urlRoot: "/highlight_sessions",

        modelConstructor: function() {
            return HighlightSession;
        }

    });

    var HighlightSession = api.ApiModel.extend({
        urlRoot: "/highlight_sessions",

        collectionConstructor: HighlightSessionCollection,

        fields: {
            id: new fields.IntegerField({primaryKey: true}),
            user_id: new fields.StringField(),
            chat_session_id: new fields.StringField(),
            rank: new fields.IntegerField()
        },

        relatedFields: {
            user: new fields.ForeignKey({
                relation: user_models.User,
                backref: "highlight_sessions"
            }),

            chat_session: new fields.ForeignKey({
                relation: chat_session_models.ChatSession,
                backref: "highlight_sessions"
            })
        }
    });

    return {
        HighlightSession: HighlightSession,
        HighlightSessionCollection: HighlightSessionCollection
    };
});
