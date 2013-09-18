define([
    'jquery',
    'underscore',
    '../base',
    '../fields',
    './tag'

], function(
    $,
    _,
    api,
    fields,
    tag_models) {

    var TopicCollection = api.ApiCollection.extend({

        urlRoot: "/topics",

        modelConstructor: function() {
            return Topic;
        }
    });

    var Topic = api.ApiModel.extend({
        
        urlRoot: "/topics",

        collectionConstructor: TopicCollection,
        
        fields: {
            id: new fields.StringField({primaryKey: true}),
            type: new fields.StringField({defaultValue: "DEFAULT"}),
            title: new fields.StringField(),
            description: new fields.StringField(),
            parent_id: new fields.StringField({nullable: true}),
            user_id: new fields.StringField({nullable: true}),
            rank: new fields.IntegerField(),
            "public": new fields.BooleanField({defaultValue: false}),
            level: new fields.IntegerField({nullable: true}),
            duration: new fields.IntegerField(),
            recommended_participants: new fields.IntegerField()
        },
        
        relatedFields: {
            parent: new fields.ForeignKey({
                relation: "self",
                backref: "children"
            }),

            tree: new fields.RelatedField({
                relation: "self",
                many: true
            }),

            tags: new fields.ManyToMany({
                relation: tag_models.Tag
            })
        }

    });

    return {
        Topic: Topic,
        TopicCollection: TopicCollection
    };
});
