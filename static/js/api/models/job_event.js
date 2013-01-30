define([
    'jquery',
    'underscore',
    'api/base',
    'api/fields',
    'api/models/user'
], function(
    $,
    _,
    api,
    fields,
    user_models) {

    var JobEventCollection = api.ApiCollection.extend({
        urlRoot: "/job_events",

        modelConstructor: function() {
            return JobEvent;
        }

    });

    var JobEvent = api.ApiModel.extend({
        urlRoot: "/job_events",

        collectionConstructor: JobEventCollection,

        fields: {
            id: new fields.StringField({primaryKey: true}),
            start: new fields.DateTimeField(),
            end: new fields.DateTimeField(),
            description: new fields.StringField()
        },

        relatedFields: {
            candidates: new fields.ManyToMany({
                relation: user_models.User
            })
        }
    });

    return {
        JobEvent: JobEvent,
        JobEventCollection: JobEventCollection
    };
});
