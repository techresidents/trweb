define([
    'jquery',
    'underscore',
    'backbone',
    'api/base',
    'api/fields',
    'api/models/technology'
], function(
    $,
    _,
    Backbone,
    api,
    fields,
    technology_models) {

    var TechnologySearchCollection = api.ApiCollection.extend({
        urlRoot: "/technologies/search",

        modelConstructor: function() {
            return TechnologySearch;
        }

    });

    var TechnologySearch = api.ApiModel.extend({
        urlRoot: "/technologies/search",

        collectionConstructor: TechnologySearchCollection,

        fields: {
            id: new fields.IntegerField({primaryKey: true}),
            technology_id: new fields.StringField(),
            q: new fields.StringField({nullable: true}),
            ac: new fields.StringField({nullable: true}),
            name: new fields.StringField(),
            description: new fields.StringField(),
            type: new fields.StringField()
        },

        relatedFields: {
            technology: new fields.ForeignKey({
                relation: technology_models.Technology
            })
        }

    });

    return {
        TechnologySearch: TechnologySearch,
        TechnologySearchCollection: TechnologySearchCollection
    };
});
