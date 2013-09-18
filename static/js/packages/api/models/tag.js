define([
    'jquery',
    'underscore',
    '../base',
    '../fields'
], function(
    $,
    _,
    api,
    fields) {

    var TagCollection = api.ApiCollection.extend({
        urlRoot: "/tags",

        modelConstructor: function() {
            return Tag;
        }

    });

    var Tag = api.ApiModel.extend({
        urlRoot: "/tags",

        collectionConstructor: TagCollection,

        fields: {
            id: new fields.IntegerField({primaryKey: true}),
            name: new fields.StringField()
        },

        relatedFields: {
        }
    });

    return {
        Tag: Tag,
        TagCollection: TagCollection
    };
});
