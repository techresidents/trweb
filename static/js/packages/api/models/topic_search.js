define([
    'jquery',
    'underscore',
    'backbone',
    '../base',
    '../fields',
    './topic'
], function(
    $,
    _,
    Backbone,
    api,
    fields,
    topic_models) {

    var TopicSearchCollection = api.ApiCollection.extend({
        urlRoot: "/topics/search",

        modelConstructor: function() {
            return TopicSearch;
        }

    });

    var TopicSearch = api.ApiModel.extend({
        urlRoot: "/topics/search",

        collectionConstructor: TopicSearchCollection,

        fields: {
            id: new fields.StringField({primaryKey: true}),
            topic_id: new fields.StringField(),
            type: new fields.StringField(),
            title: new fields.StringField(),
            description: new fields.StringField(),
            tree: new fields.ListField(),
            duration: new fields.IntegerField(),
            q: new fields.StringField({nullable: true})
        },

        relatedFields: {
            topic: new fields.ForeignKey({
                relation: topic_models.Topic
            })
        }

    });

    return {
        TopicSearch: TopicSearch,
        TopicSearchCollection: TopicSearchCollection
    };
});
