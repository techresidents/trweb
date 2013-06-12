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


    var ChatParticipantCollection = api.ApiCollection.extend({

        urlRoot: "/chat_participants",

        modelConstructor: function() {
            return ChatParticipant;
        }
    });

    var ChatParticipant = api.ApiModel.extend({

        urlRoot: "/chat_participants",

        collectionConstructor: ChatParticipantCollection,
        
        fields: {
            id: new fields.IntegerField({primaryKey: true}),
            chat_id: new fields.StringField(),
            user_id: new fields.StringField(),
            participant: new fields.IntegerField({nullable: true})
        },
        
        relatedFields: {
            chat: new fields.ForeignKey({
                relation: chat_models.Chat,
                backref: "chat_participants"
            }),
            user: new fields.ForeignKey({
                relation: user_models.User
            })
        }
    });

    return {
        ChatParticipant: ChatParticipant,
        ChatParticipantCollection: ChatParticipantCollection
    };
});
