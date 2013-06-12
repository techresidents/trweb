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


    var ChatCredentialCollection = api.ApiCollection.extend({

        urlRoot: "/chat_credentials",

        modelConstructor: function() {
            return ChatCredential;
        }
    });

    var ChatCredential = api.ApiModel.extend({

        urlRoot: "/chat_credentials",

        collectionConstructor: ChatCredentialCollection,
        
        fields: {
            id: new fields.StringField({primaryKey: true}),
            chat_id: new fields.StringField(),
            token: new fields.StringField({nullable: true}),
            twilio_capability: new fields.StringField({nullable: true})
        },
        
        relatedFields: {
            chat: new fields.ForeignKey({
                relation: chat_models.Chat,
                backref: "chat_credentials"
            })
        }
    });

    return {
        ChatCredential: ChatCredential,
        ChatCredentialCollection: ChatCredentialCollection
    };
});
