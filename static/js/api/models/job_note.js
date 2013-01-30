define([
    'jquery',
    'underscore',
    'api/base',
    'api/fields',
    'api/models/tenant',
    'api/models/user'
], function(
    $,
    _,
    api,
    fields,
    tenant_models,
    user_models) {

    var JobNoteCollection = api.ApiCollection.extend({
        urlRoot: "/job_notes",

        modelConstructor: function() {
            return JobNote;
        }

    });

    var JobNote = api.ApiModel.extend({
        urlRoot: "/job_notes",

        collectionConstructor: JobNoteCollection,

        fields: {
            id: new fields.StringField({primaryKey: true}),
            tenant_id: new fields.StringField(),
            candidate_id: new fields.StringField(),
            employee_id: new fields.StringField(),
            note: new fields.StringField()
        },

        relatedFields: {
            tenant: new fields.ForeignKey({
                relation: tenant_models.Tenant
            }),

            candidate: new fields.ForeignKey({
                relation: user_models.User,
                backref: "job_notes"
            }),

            employee: new fields.ForeignKey({
                relation: user_models.User
            })
        }
    });

    return {
        JobNote: JobNote,
        JobNoteCollection: JobNoteCollection
    };
});
