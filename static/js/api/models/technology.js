define([
    'jquery',
    'underscore',
    'api/base',
    'api/fields'
], function(
    $,
    _,
    api,
    fields) {

    var TechnologyCollection = api.ApiCollection.extend({
        urlRoot: "/technologies",

        model: function(attributes, options) {
            return new Technology(attributes, options);
        }

    });

    var Technology = api.ApiModel.extend({
        urlRoot: "/technologies",

        collectionConstructor: TechnologyCollection,

        fields: {
            id: new fields.IntegerField({primaryKey: true}),
            type: new fields.StringField(),
            name: new fields.StringField(),
            description: new fields.StringField()
        }
    });

    return {
        Technology: Technology,
        TechnologyCollection: TechnologyCollection
    };
});
