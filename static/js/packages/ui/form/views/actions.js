define(/** @exports ui/form/views/actions */[
    'jquery',
    'underscore',
    'backbone',
    'core',
    '../../collection/views',
    '../events',
    'text!../templates/actions.html',
    'text!../templates/button_action.html'
], function(
    $,
    _,
    Backbone,
    core,
    collection_views,
    form_events,
    actions_template,
    button_action_template) {

    var FormActionsView = core.view.View.extend(
    /** @lends module:ui/form/views~FormActionsView.prototype */ {

        events: {
        },
        
        /**
         * FormActionsView constructor
         * @constructor
         * @augments module:core/view~View
         * @param {object} options Options object
         * @param {FormState} options.state Form state model
         * @param {string} [options.template] View template
         */
        initialize: function(options) {
            options = _.extend({
                template: actions_template
            }, options);

            this.template = _.template(options.template);
            this.state = options.state;

            //child views
            this.actionsView = null;
            this.initChildViews();
        },
        
        childViews: function() {
            return [this.actionsView];
        },

        initChildViews: function() {
            var viewFactory = new core.factory.FunctionFactory(
                    _.bind(this.createActionView, this));

            this.actionsView = new collection_views.CollectionView({
                collection: this.state.actions(),
                viewFactory: viewFactory
            });
        },

        createActionView: function(options) {
            var action = options.model.action();
            return action.createView({
                action: action
            });
        },

        classes: function() {
            return ['form-control-actions'];
        },

        render: function() {
            var context = this.state.toJSON();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.actionsView, '.controls');
            return this;
        }
    });

    /**
     * {@link module:core/factory~Factory|Factory} class for convenience.
     */
    FormActionsView.Factory = core.factory.buildFactory(FormActionsView);

    
    var ActionView = core.view.View.extend(
    /** @lends module:ui/form/views~ActionView.prototype */ {

        events: {
        },
        
        /**
         * ActionView constructor
         * @constructor
         * @augments module:core/view~View
         * @param {object} options Options object
         * @param {Action} options.action Action object
         * @param {ActionState} options.state Action state model
         * @param {string} [options.template] View template
         */
        initialize: function(options) {
            this.template = _.template(options.template);
            this.action = options.action;
            this.state = options.state;
        },

        classes: function() {
            var label = this.state.label().toLowerCase();
            var nameClass = 'form-action-' + label.replace(' ', '-');
            return ['form-action', nameClass];
        },

        context: function() {
            return {
                state: this.state.toJSON()
            };
        },

        render: function() {
            var context = this.context();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        }
    });

    /**
     * {@link module:core/factory~Factory|Factory} class for convenience.
     */
    ActionView.Factory = core.factory.buildFactory(ActionView);

    
    var ButtonActionView = ActionView.extend(
    /** @lends module:ui/form/views~ButtonActionView.prototype */ {

        tagName: 'button',
        
        events: _.extend({
            'click': 'onClick'
        }, ActionView.prototype.events),
        
        /**
         * ButtonActionView constructor
         * @constructor
         * @augments module:ui/form/views~ActionView
         * @param {object} options Options object
         * @param {Action} options.action Action object
         * @param {ActionState} options.state Action state model
         * @param {string} [options.classes] Additional classes
         *   to apply to the <button> element.
         * @param {string} [options.template] View template
         */
        initialize: function(options) {
            options = _.extend({
                template: button_action_template
            }, options);
            ButtonActionView.__super__.initialize.call(this, options);
            
            this.extraClasses = options.classes;

            //bind events
            this.listenTo(this.state, 'change', this.render);
        },


        classes: function() {
            var result = ButtonActionView.__super__.classes.call(this);
            result = result.concat(['button-form-action', 'btn']);
            if(this.state.primary()) {
                result.push('btn-primary');
            }
            if(!this.state.enabled()) {
                result.push('disabled');
            }
            if(this.extraClasses) {
                result.push(this.extraClasses);
            }
            return result;
        },

        render: function() {
            var context = this.context();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        },

        onClick: function(e) {
            e.preventDefault();
            if(this.state.enabled()) {
                this.triggerEvent(form_events.FORM_ACTION, {
                    action: this.action
                });
            }
        }
    });

    /**
     * {@link module:core/factory~Factory|Factory} class for convenience.
     */
    ButtonActionView.Factory = core.factory.buildFactory(ButtonActionView);

    return {
        FormActionsView: FormActionsView,
        ActionView: ActionView,
        ButtonActionView: ButtonActionView
    };

});
