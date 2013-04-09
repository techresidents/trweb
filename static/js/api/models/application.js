define([
    'jquery',
    'underscore',
    'api/base',
    'api/fields',
    'api/models/tenant',
    'api/models/user',
    'api/models/requisition'
], function(
    $,
    _,
    api,
    fields,
    tenant_models,
    user_models,
    requisition_models) {

    var ApplicationCollection = api.ApiCollection.extend({
        urlRoot: "/applications",

        modelConstructor: function() {
            return Application;
        }

    });

    var Application = api.ApiModel.extend({
        urlRoot: "/applications",

        collectionConstructor: ApplicationCollection,

        fields: {
            id: new fields.StringField({primaryKey: true}),
            tenant_id: new fields.StringField(),
            user_id: new fields.StringField(),
            creator_id: new fields.StringField(),
            requisition_id: new fields.StringField(),
            type: new fields.StringField(),
            status: new fields.StringField(),
            created: new fields.DateTimeField({nullable: true})
        },

        relatedFields: {
            tenant: new fields.ForeignKey({
                relation: tenant_models.Tenant,
                backref: "applications"
            }),

            user: new fields.ForeignKey({
                relation: user_models.User,
                backref: "applications"
            }),

            creator: new fields.ForeignKey({
                relation: user_models.User
            }),

            requisition: new fields.ForeignKey({
                relation: requisition_models.Requisition,
                backref: "applications"
            })
        }
    });

    return {
        Application: Application,
        ApplicationCollection: ApplicationCollection
    };
});
