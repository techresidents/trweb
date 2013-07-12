define([
    'jquery',
    'underscore',
    '../base',
    '../fields',
    './user'
], function(
    $,
    _,
    api,
    fields,
    user_models) {

    var DeveloperProfileCollection = api.ApiCollection.extend({
        urlRoot: "/developer_profiles",

        modelConstructor: function() {
            return DeveloperProfile;
        }

    });

    var DeveloperProfile  = api.ApiModel.extend({
        urlRoot: "/developer_profiles",

        collectionConstructor: DeveloperProfileCollection,

        fields: {
            id: new fields.StringField({primaryKey: true}),
            user_id: new fields.StringField(),
            location: new fields.StringField({nullable: true }),
            developer_since: new fields.DateField({nullable: true}),
            actively_seeking: new fields.BooleanField()
        },

        relatedFields: {
            user: new fields.OneToOne({
                relation: user_models.User,
                backref: "developer_profile"
            })
        }
    });

    return {
        DeveloperProfile: DeveloperProfile,
        DeveloperProfileCollection: DeveloperProfileCollection
    };
});
