define([
    'jquery',
    'underscore',
    '../base',
    '../fields',
    './tenant'
], function(
    $,
    _,
    api,
    fields,
    tenant_models) {

    var CompanyProfileCollection = api.ApiCollection.extend({
        urlRoot: "/company_profiles",

        modelConstructor: function() {
            return CompanyProfile;
        }

    });

    var CompanyProfile = api.ApiModel.extend({
        urlRoot: "/company_profiles",

        collectionConstructor: CompanyProfileCollection,

        fields: {
            id: new fields.StringField({primaryKey: true}),
            tenant_id: new fields.StringField(),
            size: new fields.StringField(),
            name: new fields.StringField({nullable: true}),
            description: new fields.StringField({nullable: true}),
            location: new fields.StringField({nullable: true}),
            url: new fields.StringField({nullable: true})
        },

        relatedFields: {
            tenant: new fields.OneToOne({
                relation: tenant_models.Tenant,
                backref: "company_profile"
            })
        }
    });

    return {
        CompanyProfile: CompanyProfile,
        CompanyProfileCollection: CompanyProfileCollection
    };
});
