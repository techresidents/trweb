define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone) {

    /**
     * Abstract Base Resource model.
     * @constructor
     */
    var Document = Backbone.Model.extend({

        defaults: function() {
            return {
                name: null,
                documentUrl: null
            };
        },

        name: function() {
            return this.get('name');
        },

        setName: function(name) {
            this.set({name: name});
            return this;
        },

        documentUrl: function() {
            return this.get('documentUrl');
        },

        setDocumentUrl: function(documentUrl) {
            this.set({documentUrl: documentUrl});
            return this;
        }
    });

    /**
     * Document collection.
     * @constructor
     */
    var DocumentCollection = Backbone.Collection.extend({

        model: Document
        
    });

    return {
        Document: Document,
        DocumentCollection: DocumentCollection
    };
});
