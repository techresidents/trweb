define([
    'jquery',
    'underscore',
    '../base',
    '../fields',
    './user',
    './location'
], function(
    $,
    _,
    api,
    fields,
    user_models,
    location_models) {

    var LocationPrefCollection = api.ApiCollection.extend({
        urlRoot: "/location_prefs",

        modelConstructor: function() {
            return LocationPref;
        }

    });

    var LocationPref = api.ApiModel.extend({
        urlRoot: "/location_prefs",

        collectionConstructor: LocationPrefCollection,

        fields: {
            id: new fields.IntegerField({primaryKey: true}),
            user_id: new fields.StringField(),
            location_id: new fields.IntegerField()
        },

        relatedFields: {
            user: new fields.ForeignKey({
                relation: user_models.User,
                backref: "location_prefs"
            }),

            location: new fields.ForeignKey({
                relation: location_models.Location
            })
        }
    });

    return {
        LocationPref: LocationPref,
        LocationPrefCollection: LocationPrefCollection
    };
});
