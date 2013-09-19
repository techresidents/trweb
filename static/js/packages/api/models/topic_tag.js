define([
    'jquery',
    'underscore',
    '../base',
    '../fields',
    './topic',
    './tag'
], function(
    $,
    _,
    api,
    fields,
    topic_models,
    tag_models) {

    var TopicTagCollection = api.ApiCollection.extend({
        urlRoot: "/topic_tags",

        modelConstructor: function() {
            return TopicTag;
        }

    });

    var TopicTag = api.ApiModel.extend({
        urlRoot: "/topic_tags",

        collectionConstructor: TopicTagCollection,

        fields: {
            id: new fields.IntegerField({primaryKey: true}),
            topic_id: new fields.StringField(),
            tag_id: new fields.IntegerField()
        },

        relatedFields: {
            topic: new fields.ForeignKey({
                relation: topic_models.Topic,
                backref: "topic_tags"
            }),

            tag: new fields.ForeignKey({
                relation: tag_models.Tag
            })
        }
    });

    return {
        TopicTag: TopicTag,
        TopicTagCollection: TopicTagCollection
    };
});
