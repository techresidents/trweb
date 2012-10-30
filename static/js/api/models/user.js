define([
    'jquery',
    'underscore',
    'api/base',
    'api/fields',
    'api/models/location',
    'api/models/technology'

], function(
    $,
    _,
    api,
    fields,
    location_models,
    technology_models) {

    var UserCollection = api.ApiCollection.extend({
        urlRoot: "/users",

        model: function(attributes, options) {
            return new User(attributes, options);
        }

    });

    var User = api.ApiModel.extend({
        urlRoot: "/users",

        collectionConstructor: UserCollection,

        fields: {
            id: new fields.IntegerField({primaryKey: true}),
            first_name: new fields.StringField(),
            last_name: new fields.StringField(),
            email: new fields.StringField()
        },

        relatedFields: {
            location_prefs: new fields.ManyToMany({
                relation: location_models.Location
            }),

            technology_prefs: new fields.ManyToMany({
                relation: technology_models.Technology,
                backref: "users"
            })
        }

    });

    return {
        User: User,
        UserCollection: UserCollection
    };
});
