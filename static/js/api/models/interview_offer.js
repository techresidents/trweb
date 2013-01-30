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

    var InterviewOfferCollection = api.ApiCollection.extend({
        urlRoot: "/interview_offers",

        modelConstructor: function() {
            return InterviewOffer;
        }

    });

    var InterviewOffer = api.ApiModel.extend({
        urlRoot: "/interview_offers",

        collectionConstructor: InterviewOfferCollection,

        fields: {
            id: new fields.StringField({primaryKey: true}),
            tenant_id: new fields.StringField(),
            candidate_id: new fields.StringField(),
            employee_id: new fields.StringField(),
            requisition_id: new fields.StringField(),
            type: new fields.StringField(),
            status: new fields.StringField(),
            expires: new fields.DateTimeField()
        },

        relatedFields: {
            tenant: new fields.ForeignKey({
                relation: tenant_models.Tenant
            }),

            candidate: new fields.ForeignKey({
                relation: user_models.User,
                backref: "interview_offers"
            }),

            employee: new fields.ForeignKey({
                relation: user_models.User
            }),

            requisition: new fields.ForeignKey({
                relation: requisition_models.Requisition,
                backref: "interview_offers"
            })
        }
    });

    return {
        InterviewOffer: InterviewOffer,
        InterviewOfferCollection: InterviewOfferCollection
    };
});
