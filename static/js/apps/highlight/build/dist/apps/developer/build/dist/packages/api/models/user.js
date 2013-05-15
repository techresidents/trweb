define([
    'jquery',
    'underscore',
    '../base',
    '../fields',
    './location',
    './technology',
    './tenant'

], function(
    $,
    _,
    api,
    fields,
    location_models,
    technology_models,
    tenant_models) {

    var UserCollection = api.ApiCollection.extend({
        urlRoot: "/users",

        modelConstructor: function() {
            return User;
        }

    });

    var User = api.ApiModel.extend({
        urlRoot: "/users",

        collectionConstructor: UserCollection,

        fields: {
            id: new fields.StringField({primaryKey: true}),
            tenant_id: new fields.StringField(),
            first_name: new fields.StringField(),
            last_name: new fields.StringField(),
            email: new fields.StringField()
        },

        relatedFields: {
            tenant: new fields.ForeignKey({
                relation: tenant_models.Tenant
            }),

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
