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

    var EmployerProfileCollection = api.ApiCollection.extend({
        urlRoot: "/employer_profiles",

        modelConstructor: function() {
            return EmployerProfile;
        }

    });

    var EmployerProfile  = api.ApiModel.extend({
        urlRoot: "/employer_profiles",

        collectionConstructor: EmployerProfileCollection,

        fields: {
            id: new fields.StringField({primaryKey: true}),
            user_id: new fields.StringField(),
            employer_since: new fields.DateTimeField()
        },

        relatedFields: {
            user: new fields.OneToOne({
                relation: user_models.User,
                backref: "employer_profile"
            })
        }
    });

    return {
        EmployerProfile: EmployerProfile,
        EmployerProfileCollection: EmployerProfileCollection
    };
});
