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

    var SkillCollection = api.ApiCollection.extend({
        urlRoot: "/skills",

        modelConstructor: function() {
            return Skill;
        }

    });

    var Skill = api.ApiModel.extend({
        urlRoot: "/skills",

        collectionConstructor: SkillCollection,

        fields: {
            id: new fields.IntegerField({primaryKey: true}),
            yrs_experience: new fields.IntegerField(),
            expertise: new fields.StringField(),
            user_id: new fields.StringField(),
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
