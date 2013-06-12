define([
    'jquery',
    'underscore',
    'core',
    '../base',
    '../fields',
    './topic',
    './user'

], function(
    $,
    _,
    core,
    api,
    fields,
    topic_models,
    user_models) {
    
    var ChatMessageCollection = api.ApiCollection.extend({

        urlRoot: "/chat_messages",

        modelConstructor: function() {
            return ChatMessage;
        }
    });

    var ChatMessage = api.ApiModel.extend({

        urlRoot: "/chat_messages",

        collectionConstructor: ChatMessageCollection,
        
        fields: {
            id: new fields.StringField({primaryKey: true}),
            header: new fields.DictField(),
            user_status_message: new fields.DictField({
                nullable: true
            }),
            chat_status_message: new fields.DictField({
                nullable: true
            })
        }
    });

    return {
        ChatMessage: ChatMessage,
        ChatMessageCollection: ChatMessageCollection
    };
});
