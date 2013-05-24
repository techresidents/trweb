define([
    'jquery',
    'underscore',
    '../base',
    '../fields',
    './user',
    './topic'
], function(
    $,
    _,
    api,
    fields,
    user_models,
    topic_models) {

    var TalkingPointCollection = api.ApiCollection.extend({
        urlRoot: "/talking_points",

        modelConstructor: function() {
            return TalkingPoint;
        }

    });

    var TalkingPoint = api.ApiModel.extend({
        urlRoot: "/talking_points",

        collectionConstructor: TalkingPointCollection,

        fields: {
            id: new fields.IntegerField({primaryKey: true}),
            user_id: new fields.StringField(),
            topic_id: new fields.StringField(),
            rank: new fields.IntegerField(),
            point: new fields.StringField()
        },

        relatedFields: {
            user: new fields.ForeignKey({
                relation: user_models.User
            }),

            topic: new fields.ForeignKey({
                relation: topic_models.Topic,
                backref: "talking_points"
            })
        }
    });

    return {
        TalkingPoint: TalkingPoint,
        TalkingPointCollection: TalkingPointCollection
    };
});
