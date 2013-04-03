define([
    'jquery',
    'underscore',
    'api/base',
    'api/fields',
    'api/models/tenant',
    'api/models/user',
    'api/models/application'
], function(
    $,
    _,
    api,
    fields,
    tenant_models,
    user_models,
    application_models) {

    var ApplicationLogCollection = api.ApiCollection.extend({
        urlRoot: "/application_logs",

        modelConstructor: function() {
            return ApplicationLog;
        }

    });

    var ApplicationLog = api.ApiModel.extend({
        urlRoot: "/application_logs",

        collectionConstructor: ApplicationLogCollection,

        fields: {
            id: new fields.StringField({primaryKey: true}),
            tenant_id: new fields.StringField(),
            user_id: new fields.StringField(),
            application_id: new fields.StringField(),
            note: new fields.StringField(),
            created: new fields.DateTimeField({nullable: true})
        },

        relatedFields: {
            tenant: new fields.ForeignKey({
                relation: tenant_models.Tenant
            }),

            user: new fields.ForeignKey({
                relation: user_models.User
            }),

            application: new fields.ForeignKey({
                relation: application_models.Application,
                backref: "application_logs"
            })
        }
    });

    return {
        ApplicationLog: ApplicationLog,
        ApplicationLogCollection: ApplicationLogCollection
    };
});
