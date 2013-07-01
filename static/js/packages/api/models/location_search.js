define([
    'jquery',
    'underscore',
    'backbone',
    '../base',
    '../fields',
    './location'
], function(
    $,
    _,
    Backbone,
    api,
    fields,
    location_models) {

    var LocationSearchCollection = api.ApiCollection.extend({
        urlRoot: "/locations/search",

        modelConstructor: function() {
            return LocationSearch;
        }

    });

    var LocationSearch = api.ApiModel.extend({
        urlRoot: "/locations/search",

        collectionConstructor: LocationSearchCollection,

        fields: {
            id: new fields.IntegerField({primaryKey: true}),
            location_id: new fields.IntegerField(),
            q: new fields.StringField({nullable: true}),
            ac: new fields.StringField({nullable: true}),
            region: new fields.StringField()
        },

        relatedFields: {
            location: new fields.ForeignKey({
                relation: location_models.Location
            })
        }

    });

    return {
        LocationSearch: LocationSearch,
        LocationSearchCollection: LocationSearchCollection
    };
});
