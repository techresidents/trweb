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

    var ArchiveCollection = api.ApiCollection.extend({

        urlRoot: "/archives",

        modelConstructor: function() {
            return Archive;
        }
    });

    var Archive = api.ApiModel.extend({

        urlRoot: "/archives",

        collectionConstructor: ArchiveCollection,
        
        fields: {
            id: new fields.StringField({primaryKey: true}),
            chat_id: new fields.StringField(),
            path: new fields.StringField(),
            mime_type: new fields.StringField(),
            url: new fields.StringField(),
            ssl_url: new fields.StringField(),
            streaming_url: new fields.StringField(),
            length: new fields.IntegerField({nullable: true}),
            offset: new fields.IntegerField({nullable: true}),
            'public': new fields.BooleanField(),
            waveform: new fields.StringField({nullable: true}),
            waveform_path: new fields.StringField({nullable: true}),
            waveform_url: new fields.StringField({nullable: true})
        },
        
        relatedFields: {
            chat: new fields.ForeignKey({
                relation: chat_models.Chat,
                backref: "archives"
            })
        }
    });

    return {
        Archive: Archive,
        ArchiveCollection: ArchiveCollection
    };
});
