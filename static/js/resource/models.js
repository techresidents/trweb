define([
    'jquery',
    'underscore',
    'backbone',
    'document/models'
], function($, _, Backbone, document_models) {

    /**
     * Abstract Base Resource model.
     * @constructor
     */
    var Resource = Backbone.Model.extend({

        defaults: function() {
            return {
                type: null
            };
        },

        type: function() {
            return this.get('type');
        },

        setType: function(type) {
            this.set({type: type});
            return this;
        }
    });

    var DocumentResource = Resource.extend({

        defaults: function() {
            return {
                document: null
            };
        },

        initialize: function() {
            this.attributes.document = new document_models.Document(this.attributes.document);
        },

        document: function() {
            return this.get('document');
        },

        setDocument: function(document) {
            this.set({document: document});
            return this;
        },

        toJSON: function() {
            return _.extend({}, this.attributes, {
                document: this.attributes.document.toJSON()
            });
        }
    });


    /**
     * Resource collection.
     * @constructor
     */
    var ResourceCollection = Backbone.Collection.extend({

        model: function(attributes, options) {
            var result = null;
            switch(attributes.type) {
                case 'DOCUMENT':
                    result = new DocumentResource(attributes, options);
                    break;
                default:
                    result = new Resource(attributes, options);
                    break;
            }
            return result;
        },
        
        initialize: function() {
        }
        
    });

    return {
        ResourceCollection: ResourceCollection,
        resourceCollection: new ResourceCollection()
    };
});
