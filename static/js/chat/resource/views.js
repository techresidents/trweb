define([
    'jQuery',
    'Underscore',
    'Backbone',
    'resource/models',
    'text!chat/resource/templates/resource_document.html',
    'text!chat/resource/templates/resource_select.html',
    'text!chat/resource/templates/resource_tab.html',
], function(
    $,
    _,
    Backbone,
    resource_models,
    resource_document_template,
    resource_select_template,
    resource_tab_template) {

    /**
     * Resource document view.
     * @constructor
     * @param {Object} options View options
     */
    var ResourceDocumentView = Backbone.View.extend({

        tagName: 'div',

        initialize: function() {
            this.template = _.template(resource_document_template);
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },
    });

    /**
     * Resource select view.
     * @constructor
     * @param {Object} options
     *   collection: ResourceCollection (required)
     *   onChange: callback method to be invoked
     *      when topic selection changes. Method
     *      will be invoked with the selected Topic
     *      object as the sole parameter. (optional)
     *   context: callback context (optional)
     */
    var ResourceSelectView = Backbone.View.extend({

        tagName: 'select',

        events: {
            'change': 'changed',
        },
        
        initialize: function() {
            this.template = _.template(resource_select_template);
            this.onChange = this.options.onChange;
            this.context = this.options.context;
        },

        render: function() {
            this.$el.html(this.template({'resources': this.collection.toJSON()}));
            return this;
        },

        changed: function(e) {
            var resourceId = e.currentTarget.value;
            var resource = this.collection.get(resourceId);
            if(this.onChange) {
                this.onChange.call(this.context, resource);
            }
        },
    });

    /**
     * Resource tab view.
     * @constructor
     * @param {Object} options View options
     *   documentSelector: el selector for ResourceDocumentView
     *   resourceSelectSelector: el selector for ResourceSelectView
     */
    var ChatResourceTabView = Backbone.View.extend({
        
        resourceSelectSelector: '#resource-select',

        documentSelector: '#resource-document',

        initialize: function() {
            this.template = _.template(resource_tab_template);
            this.resourceViews = {};
            this.currentResourceView = null;
        },

        render: function() {

            this.$el.html(this.template());

            new ResourceSelectView({
                el: this.$(this.resourceSelectSelector),
                collection: resource_models.resourceCollection,
                onChange: this.resourceChanged,
                context: this,
            }).render();


            return this;
        },

        resourceChanged: function(resource) {
            if(resource && this.resourceViews[resource.id]) {
                this.currentResourceView.$el.toggle(false);
                this.currentResourceView = this.resourceViews[resource.id];
                this.currentResourceView.$el.toggle(true);
            } else {
                if(this.currentResourceView) {
                    this.currentResourceView.$el.toggle(false);
                }
                if(resource) {
                    this.resourceViews[resource.id] = new ResourceDocumentView({
                        el: this.$(this.documentSelector),
                        model: resource,
                    }).render();

                    this.currentResourceView = this.resourceViews[resource.id]
                }
            }
        }
    });

    return {
        ChatResourceTabView: ChatResourceTabView,
    };
});
