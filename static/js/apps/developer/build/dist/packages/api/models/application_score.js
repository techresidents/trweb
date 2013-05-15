define([
    'jquery',
    'underscore',
    '../base',
    '../fields',
    './tenant',
    './user',
    './application'
], function(
    $,
    _,
    api,
    fields,
    tenant_models,
    user_models,
    application_models) {

    var ApplicationScoreCollection = api.ApiCollection.extend({
        urlRoot: "/application_scores",

        modelConstructor: function() {
            return ApplicationScore;
        }

    });

    var ApplicationScore = api.ApiModel.extend({
        urlRoot: "/application_scores",

        collectionConstructor: ApplicationScoreCollection,

        fields: {
            id: new fields.StringField({primaryKey: true}),
            tenant_id: new fields.StringField(),
            user_id: new fields.StringField(),
            application_id: new fields.StringField(),
            technical_score: new fields.IntegerField(),
            communication_score: new fields.IntegerField(),
            cultural_fit_score: new fields.IntegerField()
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
                backref: "application_scores"
            })
        }
    });

    return {
        ApplicationScore: ApplicationScore,
        ApplicationScoreCollection: ApplicationScoreCollection
    };
});
