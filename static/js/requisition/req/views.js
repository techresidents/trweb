define([
    'jquery',
    'underscore',
    'core/view',
    'text!requisition/req/templates/req.html',
    'text!requisition/req/templates/create_requisition.html',
    'text!requisition/req/templates/read_requisition.html',
    'text!requisition/req/templates/edit_requisition.html'
], function(
    $,
    _,
    view,
    requisition_template,
    create_requisition_template,
    read_requisition_template,
    edit_requisition_template) {

    /**
     * Requisition View Events
     */
    var EVENTS = {
    };

    /**
     * Requisition Skills View.
     * @constructor
     * @param {Object} options
     *      collection: {} (optional)
     */
    var RequisitionSkillsView = view.View.extend({
        // TODO
    });

    /**
     * Edit Requisition Skills View.
     * @constructor
     * @param {Object} options
     *      collection: {} (optional)
     */
    var EditRequisitionSkillsView = view.View.extend({
        // TODO
    });

    /**
     * Edit Requisition View.
     * @constructor
     * @param {Object} options
     *  model: {Requisition} (required)
     */
    var EditRequisitionView = view.View.extend({
        //TODO
    });

    /**
     * Create Requisition View.
     * @constructor
     * @param {Object} options
     *   model: Requisition model (required)
     */
    var CreateRequisitionView = view.View.extend({

        initialize: function(options) {
            this.template = _.template(create_requisition_template);
        },

        render: function() {
            var context = {
                model: this.model.toJSON({withRelated: true})
            };
            this.$el.html(this.template(context));
            return this;
        }
    });

    /**
     * Read Requisition View.
     * @constructor
     * @param {Object} options
     *   model: Requisition model (required)
     */
    var ReadRequisitionView = view.View.extend({

        initialize: function(options) {
            this.template = _.template(read_requisition_template);
            this.model.bind('change', this.render, this);
            this.model.bind('loaded', this.loaded, this);

            if(!this.model.isLoading()) {
                this.load();
            }
        },

        loaded: function(instance) {
            //Cover case where model was already loading at time of view
            //creation, but not all necessary data was loaded. Invoking
            //load again will ensure all necessary data is loaded. If
            //all data is already loaded, this is a no-op.
            this.load();
        },

        load: function() {
            var state = this.model.isLoadedWith('technology'); //TODO
            if(!state.loaded) {
                state.fetcher({
                    success: _.bind(this.render, this)
                });
            }
        },

        render: function() {
            var context = {
                model: this.model.toJSON({withRelated: true})
            };
            this.$el.html(this.template(context));
            return this;
        }
    });

    /**
     * Requisition main view.
     * @constructor
     * @param {Object} options
     *   model: {Requisition} (required).
     *   If model has no ID, then a view to create
     *   a new requisition will be displayed.
     */
    var RequisitionView = view.View.extend({

        events: {
        },

        requisition_view_selector: '#requisition-container',

        childViews: function() {
            return [this.requisitionView];
        },

        initialize: function() {
            this.template =  _.template(requisition_template);

            //child views
            this.requisitionView = null;

            if(!this.model.isLoading()) {
                this.load();
            }
        },

        loaded: function(instance) {
            if(instance === this.model) {
                this.load();
            }
        },

        load: function() {
            if(!this.model.isLoaded()) {
                this.model.fetch();
            }
        },

        render: function() {
            _.each(this.childViews, function(view) {
                view.destroy();
            });

            this.$el.html(this.template());

            // Need to determine if user is creating a
            // new req or viewing an existing req
            if (this.model.id === undefined) {
                this.requisitionView = new CreateRequisitionView({
                    el: this.$(this.requisition_view_selector),
                    model: this.model
                }).render();
            } else {
                this.requisitionView = new ReadRequisitionView({
                    el: this.$(this.requisition_view_selector),
                    model: this.model
                }).render();
            }

            return this;
        }
    });

    return {
        EVENTS: EVENTS,
        RequisitionView: RequisitionView
    };
});
