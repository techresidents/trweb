define([
    'jquery',
    'underscore',
    'api/base',
    'api/fields',
    'api/models/technology',
    'api/models/requisition'
], function(
    $,
    _,
    api,
    fields,
    technology_models,
    requisition_models) {

    var RequisitionTechnologyCollection = api.ApiCollection.extend({
        urlRoot: "/requisition_technologies",

        modelConstructor: function() {
            return RequisitionTechnology;
        }

    });

    var RequisitionTechnology = api.ApiModel.extend({
        urlRoot: "/requisition_technologies",

        collectionConstructor: RequisitionTechnologyCollection,

        fields: {
            id: new fields.IntegerField({primaryKey: true}),
            requisition_id: new fields.StringField(),
            technology_id: new fields.IntegerField(),
            yrs_experience: new fields.IntegerField()
        },

        relatedFields: {
            requisition: new fields.ForeignKey({
                relation: requisition_models.Requisition,
                backref: "requisition_technologies"
            }),

            technology: new fields.ForeignKey({
                relation: technology_models.Technology
            })
        }
    });

    return {
        RequisitionTechnology: RequisitionTechnology,
        RequisitionTechnologyCollection: RequisitionTechnologyCollection
    };
});
