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

    var PositionPrefCollection = api.ApiCollection.extend({
        urlRoot: "/position_prefs",

        modelConstructor: function() {
            return PositionPref;
        }

    });

    var PositionPref = api.ApiModel.extend({
        urlRoot: "/position_prefs",

        collectionConstructor: PositionPrefCollection,

        fields: {
            id: new fields.IntegerField({primaryKey: true}),
            type: new fields.StringField(),
            user_id: new fields.StringField(),
            salary_start: new fields.IntegerField({nullable: true}),
            salary_end: new fields.IntegerField({nullable: true})
        },

        relatedFields: {
            user: new fields.ForeignKey({
                relation: user_models.User,
                backref: "position_prefs"
            })
        }
    });

    return {
        PositionPref: PositionPref,
        PositionPrefCollection: PositionPrefCollection
    };
});
