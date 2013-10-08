define([
    'jquery',
    'underscore',
    '../base',
    '../fields',
    './chat'
], function(
    $,
    _,
    api,
    fields,
    chat_models) {

    var SpotlightChatCollection = api.ApiCollection.extend({
        urlRoot: "/spotlight_chats",

        modelConstructor: function() {
            return SpotlightChat;
        }

    });

    var SpotlightChat = api.ApiModel.extend({
        urlRoot: "/spotlight_chats",

        collectionConstructor: SpotlightChatCollection,

        fields: {
            id: new fields.IntegerField({primaryKey: true}),
            chat_id: new fields.StringField(),
            rank: new fields.IntegerField()
        },

        relatedFields: {
            chat: new fields.ForeignKey({
                relation: chat_models.Chat
            })
        }
    });

    return {
        SpotlightChat: SpotlightChat,
        SpotlightChatCollection: SpotlightChatCollection
    };
});
