define([
    'jquery',
    'underscore',
    'api/base',
    'api/fields',
    'api/models/chat_session'

], function(
    $,
    _,
    api,
    fields,
    chat_session_models) {

    var ArchiveCollection = api.ApiCollection.extend({

        urlRoot: "/archives",

        model: function(attributes, options) {
            return new Archive(attributes, options);
        }
    });

    var Archive = api.ApiModel.extend({

        urlRoot: "/archives",

        collectionConstructor: ArchiveCollection,
        
        fields: {
            id: new fields.StringField({primaryKey: true}),
            type: new fields.StringField(),
            chat_session_id: new fields.StringField(),
            path: new fields.StringField(),
            mime_type: new fields.StringField(),
            url: new fields.StringField(),
            ssl_url: new fields.StringField(),
            streaming_url: new fields.StringField(),
            length: new fields.IntegerField({nullable: true}),
            offset: new fields.IntegerField({nullable: true}),
            'public': new fields.BooleanField()
        },
        
        relatedFields: {
            chat_session: new fields.ForeignKey({
                relation: chat_session_models.ChatSession,
                backref: "archives"
            })
        }
    });

    return {
        Archive: Archive,
        ArchiveCollection: ArchiveCollection
    };
});