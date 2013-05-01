define([
    'jquery',
    'underscore',
    'backbone',
    'api/base',
    'api/fields',
    'api/models/user'
], function(
    $,
    _,
    Backbone,
    api,
    fields,
    user_models) {

    var UserSearchCollection = api.ApiCollection.extend({
        urlRoot: "/users/search",

        modelConstructor: function() {
            return UserSearch;
        }

    });

    var UserSearch = api.ApiModel.extend({
        urlRoot: "/users/search",

        collectionConstructor: UserSearchCollection,

        fields: {
            id: new fields.StringField({primaryKey: true}),
            user_id: new fields.StringField(),
            q: new fields.StringField({nullable: true}),
            yrs_experience: new fields.IntegerField(),
            joined: new fields.DateTimeField(),
            skills: new fields.ListField(),
            location_prefs: new fields.ListField(),
            position_prefs: new fields.ListField()
        },

        relatedFields: {
            user: new fields.ForeignKey({
                relation: user_models.User
            })
        }

    });

    return {
        UserSearch: UserSearch,
        UserSearchCollection: UserSearchCollection
    };
});
