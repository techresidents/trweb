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
         */
        initialize: function(options) {
            options = _.extend({
                primary: true
            }, options);

            this.label = options.label;
            this.handler = options.handler;
            this.primary = options.primary;
            this.viewFactory = options.viewFactory;

            this.state = new models.ActionState({
                label: options.label,
                primary: options.primary
            });

            this.view = null;
        },

        createView: function(options) {
            options = _.extend({
                state: this.state
            }, options);
            this.view = this.viewFactory.create(options);
            return this.view;
        },

        enabled: function(state) {
            var result = true;
            if(this.primary) {
                result = state.dirty() && state.valid();
            }
            return result;
        },

        handle: function(state) {
            if(_.isFunction(this.handler)) {
                this.handler(state);
            } else if(_.isObject(this.handler)) {
                this.handler.handle(state);
            }
        }
    });

    var ButtonAction = Action.extend(
    /** @lends module:ui/form/actions~SaveAction.prototype */ {

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
                viewFactory: new views.ButtonActionView.Factory()
            }, options);
            ButtonAction.__super__.initialize.call(this, options);
        }
    });

    return {
        Action: Action,
        ButtonAction: ButtonAction
    };

});
