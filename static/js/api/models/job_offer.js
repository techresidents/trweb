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
            requisition_id: new fields.StringField(),
            status: new fields.StringField(),
            salary: new fields.IntegerField()
        },

        relatedFields: {
            tenant: new fields.ForeignKey({
                relation: tenant_models.Tenant
            }),

            candidate: new fields.ForeignKey({
                relation: user_models.User,
                backref: "job_offers"
            }),

            employee: new fields.ForeignKey({
                relation: user_models.User
            }),

            requisition: new fields.ForeignKey({
                relation: requisition_models.Requisition,
                backref: "job_offers"
            })
        }
    });

    return {
        JobOffer: JobOffer,
        JobOfferCollection: JobOfferCollection
    };
});
