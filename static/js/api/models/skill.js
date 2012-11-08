define([
    'jquery',
    'underscore',
    'api/base',
    'api/fields',
    'api/models/user',
    'api/models/technology'
], function(
    $,
    _,
    api,
    fields,
    user_models,
    technology_models) {

    var SkillCollection = api.ApiCollection.extend({
        urlRoot: "/skills",

        model: function(attributes, options) {
            return new Skill(attributes, options);
        }

    });

    var Skill = api.ApiModel.extend({
        urlRoot: "/skills",

        collectionConstructor: SkillCollection,

        fields: {
            id: new fields.IntegerField({primaryKey: true}),
            yrs_experience: new fields.IntegerField(),
            expertise: new fields.StringField(),
            user_id: new fields.IntegerField(),
            technology_id: new fields.IntegerField()
        },

        relatedFields: {
            user: new fields.ForeignKey({
                relation: user_models.User,
                backref: "skills"
            }),

            technology: new fields.ForeignKey({
                relation: technology_models.Technology,
                backref: "skills"
            })
        }
    });

    return {
        Skill: Skill,
        SkillCollection: SkillCollection
    };
});
