define([
    'jquery',
    'underscore',
    'core',
    'api',
    'widget',
    './forms',
    'text!./templates/requisition.html',
    'text!./templates/requisition_create.html',
    'text!./templates/requisition_edit.html'
], function(
    $,
    _,
    core,
    api,
    widget,
    forms,
    requisition_template,
    create_requisition_template,
    edit_requisition_template) {

    /**
     * Create Requisition View.
     * @constructor
     * @param {Object} options
     *   model: {Requisition} (required)
     *   userModel: {User} (required)
     */
    var CreateRequisitionView = core.view.View.extend({

        initialize: function(options) {
            this.model = options.model;
            this.template = _.template(create_requisition_template);

            // child views
            this.formView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [this.formView];
        },

        initChildViews: function() {
            this.formView = new forms.CreateRequisitionFormView({
                model: this.model
            });
        },

        classes: function() {
            return ['create-requisition'];
        },

        render: function() {
            this.$el.html(this.template());
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.formView);
            return this;
        }
    });

    /**
     * Edit Requisition View.
     * @constructor
     * @param {Object} options
     *   model: {Requisition} (required)
     *   userModel: {User} (required)
     */
    var EditRequisitionView = core.view.View.extend({

        initialize: function(options) {
            this.model = options.model;
            this.template = _.template(edit_requisition_template);
            this.modelWithRelated = ['requisition_technologies__technology'];

            //loader
            this.loader = new api.loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated}
            ]);

            //bind events
            this.listenTo(this.loader, 'loaded', this.render);

            this.loader.load();

            // child views
            this.formView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [this.formView];
        },

        initChildViews: function() {
            this.formView = new forms.RequisitionFormView({
                model: this.model
            });
        },

        classes: function() {
            return ['edit-requisition'];
        },

        render: function() {
            var context = {
                fmt: this.fmt
            };
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            if(this.loader.isLoaded()) {
                this.append(this.formView);
            }
            return this;
        }
    });

    /**
     * Requisition View.
     * @constructor
     * @param {Object} options
     *   model: Requisition model (required)
     */
    var RequisitionView = core.view.View.extend({

        initialize: function(options) {
            this.model = options.model;
            this.template = _.template(requisition_template);
            this.modelWithRelated = ['requisition_technologies__technology'];
            this.loader = new api.loader.ApiLoader([
                {instance: this.model, withRelated: this.modelWithRelated}
            ]);

            // bindings
            this.listenTo(this.loader, 'loaded', this.render);

            // load data
            this.loader.load();

            // child views
            this.childViews = [];
            this.wishlistView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.wishlistView = new widget.skill.views.SkillsView({
                collection: this.model.get_requisition_technologies()
            });
        },

        classes: function() {
            return ['requisition'];
        },

        render: function() {
            var context = {
                fmt: this.fmt,
                model: this.model.toJSON({
                    withRelated: this.modelWithRelated
                })
            };
            if(this.loader.isLoaded()) {
                this.$el.html(this.template(context));
                this.$el.attr('class', this.classes().join(' '));
                this.append(this.wishlistView, '.requisition-wishlist-container');
            }
            return this;
        }
    });

    return {
        RequisitionView: RequisitionView,
        CreateRequisitionView: CreateRequisitionView,
        EditRequisitionView: EditRequisitionView
    };

});
