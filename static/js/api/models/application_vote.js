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

    var ApplicationVoteCollection = api.ApiCollection.extend({
        urlRoot: "/application_votes",

        modelConstructor: function() {
            return ApplicationVote;
        }

    });

    var ApplicationVote = api.ApiModel.extend({
        urlRoot: "/application_votes",

        collectionConstructor: ApplicationVoteCollection,

        fields: {
            id: new fields.StringField({primaryKey: true}),
            tenant_id: new fields.StringField(),
            user_id: new fields.StringField(),
            application_id: new fields.StringField(),
            yes: new fields.BooleanField({nullable: true})
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
                backref: "application_votes"
            })
        }
    });

    return {
        ApplicationVote: ApplicationVote,
        ApplicationVoteCollection: ApplicationVoteCollection
    };
});
