define([
    'jQuery',
    'Underscore',
    'core/view',
    'text!chat/resource/templates/resource_document.html',
    'text!chat/resource/templates/resource_select.html',
    'text!chat/resource/templates/resource_tab.html',
], function(
    $,
    _,
    view,
    resource_document_template,
    resource_select_template,
    resource_tab_template) {

    var EVENTS = {
        SELECT: 'resource:Select',
    };

    /**
     * Resource document view.
     * @constructor
     * @param {Object} options View options
     */
    var ResourceDocumentView = view.View.extend({

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
    var ResourceSelectView = view.View.extend({

        tagName: 'select',

        events: {
            'change': 'onChangeEvent',
        },
        
        initialize: function() {
            this.template = _.template(resource_select_template);
            //this.onChange = this.options.onChange;
            //this.context = this.options.context;
            this.model.on('change:selected', this.onChangeSelected, this);
        },

        render: function() {
            this.$el.html(this.template({'resources': this.model.resources().toJSON()}));
            return this;
        },

        onChangeEvent: function(e) {
            var resourceId = e.currentTarget.value;
            var resource = this.model.resources().get(resourceId);
            this.triggerEvent(EVENTS.SELECT, resource);
        },

        onChangeSelected: function(model) {
            var resource = this.model.selected();
            if(resource) {
                this.$el.val(resource.id);
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
    var ChatResourcesTabView = view.View.extend({
        
        resourceSelectSelector: '#resource-select',

        documentSelector: '#resource-document',

        initialize: function() {
            this.template = _.template(resource_tab_template);
            this.resourceViews = {};
            this.currentResourceView = null;
            this.model.on('change:selected', this.onChangeSelected, this);
        },

        render: function() {

            this.$el.html(this.template());

            new ResourceSelectView({
                el: this.$(this.resourceSelectSelector),
                model: this.model,
            }).render();

            return this;
        },

        onChangeSelected: function() {
            var resource = this.model.selected();
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
        EVENTS: EVENTS,
        ChatResourcesTabView: ChatResourcesTabView,
    };
});
