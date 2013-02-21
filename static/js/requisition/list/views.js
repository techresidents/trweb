define([
    'jquery',
    'underscore',
    'core/view',
    'api/loader',
    'text!requisition/list/templates/list.html',
    'text!requisition/list/templates/list_item.html'
], function(
    $,
    _,
    view,
    api_loader,
    list_template,
    list_item_template) {

    /**
     * Requisition List View Events
     */
    var EVENTS = {
    };

    /**
     * Requisition list item view.
     * @constructor
     * @param {Object} options
     *   model: Requisition model (required)
     */
    var RequisitionListItemView = view.View.extend({

        tagName: 'li',

        initialize: function() {
            this.template = _.template(list_item_template);
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    /**
     * Requisition list view.
     * @constructor
     * @param {Object} options
     *   collection: RequisitionCollection (required)
     */
    var RequisitionListView = view.View.extend({

        tagName: 'ul',

        initialize: function(options) {
            this.collection = options.collection;
            this.listenTo(this.collection, "reset", this.render);
            this.listenTo(this.collection, "add", this.render);
            this.listenTo(this.collection, "remove", this.render);
            this.childViews = [];
        },

        render: function() {
            console.log('listView render');
            this.destroyChildViews();
            this.childViews = [];
            this.collection.each(this.added, this);
            return this;
        },

        added: function(model) {
            var view = new RequisitionListItemView({
                model: model
            }).render();

            this.childViews.push(view);
            this.$el.append(view.el);
        }
    });

    /**
     * Requisition list main view.
     * @constructor
     * @param {Object} options
     *   collection: {RequisitionCollection} (required)
     */
    var RequisitionListSummaryView = view.View.extend({

        listSelector: 'ul',

        initialize: function(options) {
            console.log('ParentView init');
            this.collection = options.collection;
            this.template =  _.template(list_template);

            //child views
            this.requisitionListView = null;

            this.loader = new api_loader.ApiLoader([
                {
                    instance: this.collection
                }
            ]);

            this.loader.load({
                success: _.bind(this.render, this)
            });
        },

        childViews: function() {
            return [this.requisitionListView];
        },

        render: function() {
            console.log('ParentView render');
            this.destroyChildViews();
            this.$el.html(this.template());
            this.requisitionListView = new RequisitionListView({
                el: this.$(this.listSelector),
                collection: this.collection
            }).render();

            return this;
        }
    });

    return {
        EVENTS: EVENTS,
        RequisitionListSummaryView: RequisitionListSummaryView
    };
});
