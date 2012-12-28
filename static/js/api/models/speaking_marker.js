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

    var SpeakingMarkerCollection = api.ApiCollection.extend({

        urlRoot: "/speaking_markers",

        modelConstructor: function() {
            return SpeakingMarker;
        }
    });

    var SpeakingMarker = api.ApiModel.extend({

        urlRoot: "/speaking_markers",

        collectionConstructor: SpeakingMarkerCollection,
        
        fields: {
            id: new fields.StringField({primaryKey: true}),
            user_id: new fields.StringField(),
            chat_minute_id: new fields.IntegerField(),
            chat_session_id: new fields.StringField(),
            start: new fields.DateTimeField(),
            end: new fields.DateTimeField()
        },
        
        relatedFields: {
            user: new fields.ForeignKey({
                relation: user_models.User
            }),

            chat_minute: new fields.ForeignKey({
                relation: chat_minute_models.ChatMinute,
                backref: "speaking_markers"
            }),

            chat_session: new fields.ForeignKey({
                relation: chat_session_models.ChatSession,
                backref: "speaking_markers"
            })
        }
    });

    return {
        SpeakingMarker: SpeakingMarker,
        SpeakingMarkerCollection: SpeakingMarkerCollection
    };
});
