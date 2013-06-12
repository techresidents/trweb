define([
    'jquery',
    'underscore',
    '../base',
    '../fields',
    './user',
    './chat'
], function(
    $,
    _,
    api,
    fields,
    user_models,
    chat_models) {

    var ChatReelCollection = api.ApiCollection.extend({
        urlRoot: "/chat_reels",

        modelConstructor: function() {
            return ChatReel;
        }

    });

    var ChatReel = api.ApiModel.extend({
        urlRoot: "/chat_reels",

        collectionConstructor: ChatReelCollection,

        fields: {
            id: new fields.IntegerField({primaryKey: true}),
            user_id: new fields.StringField(),
            chat_id: new fields.StringField(),
            rank: new fields.IntegerField()
        },

        relatedFields: {
            user: new fields.ForeignKey({
                relation: user_models.User,
                backref: "chat_reels"
            }),

            chat: new fields.ForeignKey({
                relation: chat_models.Chat,
                backref: "chat_reels"
            })
        }
    });

    return {
        ChatReel: ChatReel,
        ChatReelCollection: ChatReelCollection
    };
});
