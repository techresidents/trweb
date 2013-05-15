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

    var LocationCollection = api.ApiCollection.extend({
        urlRoot: "/locations",

        modelConstructor: function() {
            return Location;
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
