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

    var JobOfferCollection = api.ApiCollection.extend({
        urlRoot: "/job_offers",

        modelConstructor: function() {
            return JobOffer;
        }

    });

    var JobOffer = api.ApiModel.extend({
        urlRoot: "/job_offers",

        collectionConstructor: JobOfferCollection,

        fields: {
            id: new fields.StringField({primaryKey: true}),
            tenant_id: new fields.StringField(),
            candidate_id: new fields.StringField(),
            employee_id: new fields.StringField(),
            application_id: new fields.StringField(),
            status: new fields.StringField(),
            salary: new fields.IntegerField()
        },

        relatedFields: {
            tenant: new fields.ForeignKey({
                relation: tenant_models.Tenant,
                backref: "job_offers"
            }),

            candidate: new fields.ForeignKey({
                relation: user_models.User,
                backref: "job_offers"
            }),

            employee: new fields.ForeignKey({
                relation: user_models.User
            }),

            application: new fields.ForeignKey({
                relation: application_models.Application,
                backref: "job_offers"
            })
        }
    });

    return {
        JobOffer: JobOffer,
        JobOfferCollection: JobOfferCollection
    };
});
