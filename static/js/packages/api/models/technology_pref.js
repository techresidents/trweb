define([
    'jquery',
    'underscore',
    '../base',
    '../fields',
    './user',
    './technology'
], function(
    $,
    _,
    api,
    fields,
    user_models,
    technology_models) {

    var TechnologyPrefCollection = api.ApiCollection.extend({
        urlRoot: "/technology_prefs",

        modelConstructor: function() {
            return TechnologyPref;
        }

    });

    var TechnologyPref = api.ApiModel.extend({
        urlRoot: "/technology_prefs",

        collectionConstructor: TechnologyPrefCollection,

        fields: {
            id: new fields.IntegerField({primaryKey: true}),
            user_id: new fields.StringField(),
            technology_id: new fields.IntegerField()
        },

        relatedFields: {
            user: new fields.ForeignKey({
                relation: user_models.User,
                backref: "technology_prefs"
            }),

            technology: new fields.ForeignKey({
                relation: technology_models.Technology
            })
        }
    });

    return {
        TechnologyPref: TechnologyPref,
        TechnologyPrefCollection: TechnologyPrefCollection
    };
});
