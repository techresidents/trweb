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

    var LocationCollection = api.ApiCollection.extend({
        urlRoot: "/locations",

        model: function(attributes, options) {
            return new Location(attributes, options);
        }

    });

    var Location = api.ApiModel.extend({
        urlRoot: "/locations",

        collectionConstructor: LocationCollection,

        fields: {
            id: new fields.IntegerField({primaryKey: true}),
            country: new fields.StringField(),
            state: new fields.StringField(),
            city: new fields.StringField({nullable: true}),
            county: new fields.StringField({nullable: true}),
            zip: new fields.StringField({nullable: true})
        }
    });

    return {
        Location: Location,
        LocationCollection: LocationCollection
    };
});