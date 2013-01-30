define([
    'jquery',
    'underscore',
    'core/view',
    'text!requisition/list/templates/list.html',
    'text!requisition/list/templates/list_item.html'
], function(
    $,
    _,
    view,
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

        initialize: function() {
            this.collection.bind('loaded', this.loaded, this);
            this.collection.bind('reset', this.render, this);
            this.collection.bind('add', this.added, this);
            this.childViews = [];

            if(!this.collection.isLoading()) {
                this.load();
            }
        },

        loaded: function(instance) {
            if(instance === this.collection) {
                this.load();
            }
        },

        load: function() {
            if(!this.collection.isLoaded()) {
                this.collection.fetch();
            }
        },

        render: function() {
            _.each(this.childViews, function(view) {
                view.destroy();
            });

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

        events: {
        },

        listSelector: 'ul',

        childViews: function() {
            return [this.requisitionListView];
        },

        initialize: function() {
            this.template =  _.template(list_template);

            //child views
            this.requisitionListView = null;

            if(!this.collection.isLoading()) {
                this.load();
            }
        },

        loaded: function(instance) {
            if(instance === this.collection) {
                this.load();
            }
        },

        load: function() {
            if(!this.collection.isLoaded()) {
                this.collection.fetch();
            }
        },

        render: function() {
            _.each(this.childViews, function(view) {
                view.destroy();
            });

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
