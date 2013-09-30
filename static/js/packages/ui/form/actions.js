define(/** @exports ui/form/actions */[
    'jquery',
    'underscore',
    'core',
    './models',
    './views'
], function(
    $,
    _,
    core,
    models,
    views) {

    var Action = core.base.Base.extend(
    /** @lends module:ui/form/actions~Action.prototype */ {

        /**
         * Form Action constructor
         * @constructor
         * @augments module:core/base~Base
         * @param {object} options Options object
         * @param {string} options.label Action label
         * @param {function} options.handler Handler function
         *   to be invoked when action is taken.
         * @param {Factory} options.viewFactory Action view factory
         *   to use to create the action view.
         * @param {object} [options.viewOptions] Additional view options
         *   to pass to the viewFactory create function.
         * @param {boolean} [options.primary=true] Boolean indicating
         *   that the action is a primary action and that the form
         *   must be valid before the action is allowed.
         * @param {boolean} [options.dirtyRequired=false] Boolean indicating
         *   that form state.dirty must be true for action to be enabled.
         * @param {boolean} [options.validRequired=false] Boolean indicating
         *   that form state.valid must be true for action to be enabled.
         */
        initialize: function(options) {
            options = _.extend({
                primary: true,
                dirtyRequired: false,
                validRequired: false
            }, options);

            this.label = options.label;
            this.handler = options.handler;
            this.primary = options.primary;
            this.dirtyRequired = options.dirtyRequired;
            this.validRequired = options.validRequired;

            this.viewFactory = options.viewFactory;

            this.state = new models.ActionState({
                label: options.label,
                primary: options.primary
            });

            this.formState = null;

            this.view = null;
        },

        setFormState: function(state) {
            this.stopListening();
            this.formState = state;
            this.listenTo(this.formState,
                    'change:valid change:dirty change:executing',
                    this.onFormStateChange);
            this.update(this.formState);
        },

        createView: function(options) {
            options = _.extend({
                state: this.state
            }, options);
            this.view = this.viewFactory.create(options);
            return this.view;
        },

        update: function(state) {
            var enabled = !state.executing();
            if(this.primary && enabled) {
                enabled = (!this.validRequired ||state.valid()) &&
                          (!this.dirtyRequired || state.dirty());
            }
            this.state.set({
                enabled: enabled
            });
        },

        handle: function(options) {
            //wrap success/error callback with our own methods
            //so we can manage action execution state
            var success = options.success;
            var error = options.error;

            options.success = _.bind(function() {
                this.state.setExecuting(false);
                if(_.isFunction(success)) {
                    success.apply(this, arguments);
                }
            }, this);

            options.error = _.bind(function() {
                this.state.setExecuting(false);
                if(_.isFunction(error)) {
                    error.apply(this, arguments);
                }
            }, this);

            
            this.state.setExecuting(true);

            if(_.isFunction(this.handler)) {
                this.handler(options);
            } else if(_.isObject(this.handler)) {
                this.handler.handle(options);
            }
        },

        destroy: function() {
            this.stopListening();
        },

        onFormStateChange: function() {
            this.update(this.formState);
        }
    });

    //add support for events to actions
    _.extend(Action.prototype, Backbone.Events);

    
    var ButtonAction = Action.extend(
    /** @lends module:ui/form/actions~ButtonAction.prototype */ {

        /**
         * Save Action constructor
         * @constructor
         * @augments module:ui/form/actions~Action
         * @param {object} options Options object
         * @param {string} options.label Action label
         * @param {function} options.handler Handler function
         *   to be invoked when action is taken.
         * @param {Factory} [options.viewFactory] Action view factory
         *   to use to create the action view.
         * @param {object} [options.viewOptions] Additional view options
         *   to pass to the viewFactory create function.
         * @param {boolean} [options.primary=true] Boolean indicating
         *   that the action is a primary action and that the form
         *   must be valid before the action is allowed.
         */
        initialize: function(options) {
            options = _.extend({
            }, options);
            
            if(!options.viewFactory) {
                options.viewFactory =  new views.ButtonActionView.Factory();
            }

            ButtonAction.__super__.initialize.call(this, options);
        }
    });

    return {
        Action: Action,
        ButtonAction: ButtonAction
    };

});
