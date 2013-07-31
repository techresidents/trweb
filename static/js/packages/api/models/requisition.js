define([
    'jquery',
    'underscore',
    '../base',
    '../fields',
    './technology',
    './tenant',
    './user'
], function(
    $,
    _,
    api,
    fields,
    technology_models,
    tenant_models,
    user_models) {

    var RequisitionCollection = api.ApiCollection.extend({
        urlRoot: "/requisitions",

        modelConstructor: function() {
            return Requisition;
        }

    });

    var Requisition = api.ApiModel.extend({
        urlRoot: "/requisitions",

        collectionConstructor: RequisitionCollection,

        fields: {
            id: new fields.StringField({primaryKey: true}),
            tenant_id: new fields.StringField(),
            user_id: new fields.StringField(),
            location: new fields.StringField(),
            created: new fields.DateTimeField({nullable: true}),
            status: new fields.StringField(),
            position_type: new fields.StringField(),
            title: new fields.StringField(),
            description: new fields.StringField(),
            salary: new fields.StringField(),
            telecommute: new fields.BooleanField(),
            relocation: new fields.BooleanField(),
            equity: new fields.StringField({nullable: true}),
            employer_requisition_identifier: new fields.StringField({nullable: true})
        },

        relatedFields: {
            tenant: new fields.ForeignKey({
                relation: tenant_models.Tenant,
                backref: "requisitions"
            }),

            user: new fields.ForeignKey({
                relation: user_models.User,
                backref: "requisitions"
            }),

            technologies: new fields.ManyToMany({
                relation: technology_models.Technology
            })
        }
    });

    return {
        Requisition: Requisition,
        RequisitionCollection: RequisitionCollection
    };
});
