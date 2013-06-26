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
            region: new fields.StringField(),
            country: new fields.StringField(),
            state: new fields.StringField(),
            city: new fields.StringField(),
            county: new fields.StringField(),
            zip: new fields.StringField()
        }
    });

    return {
        Location: Location,
        LocationCollection: LocationCollection
    };
});
