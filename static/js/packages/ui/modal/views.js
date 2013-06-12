define([
    'jquery',
    'jquery.bootstrap',
    'underscore',
    'core',
    'text!./templates/modal.html'
], function(
    $,
    none,
    _,
    core,
    modal_template) {

    var EventType = {
        CLOSE: 'close',
        OK: 'ok',
        SAVE: 'save',
        ACTION: 'action',
        CANCEL: 'cancel'
    };

    var ModalView = core.view.View.extend({

        events: {
            'click .close': 'onClose',
            'click .ok': 'onOk',
            'click .save': 'onSave',
            'click .cancel': 'onCancel',
            'click .action': 'onAction'
        },

        /**
         * Modal view.
         * @constructs
         * @param {object} options Options object
         * @param {module:core/view~View|module:core/factory~Factory}
         * options.viewOrFactory View or View factory object.
         * View should implement onOk, onCancel, onClose, onSave, and
         * onAction handler methods for all buttons which should be displayed.
         * All handler method should return true to close the modal.
         * If onAction is implemented view.action will be used for the
         * button label.
         * @param {string} options.title Modal title
         * @param {function} [options.ok] Ok callback function
         * @param {function} [options.cancel] Cancel callback function
         * @param {function} [options.close] Close callback function
         * @param {function} [options.save] Save callback function
         * @param {function} [options.action] Action callback function
         * @param {boolean} [options.exitOnBackdropClick=true] Exit on
         * backdrop click
         * @param {boolean} [options.exitOnEscapeKey=true] Exit on esacpe key
         * @param {boolean} [options.autoDestroy=true] Destroy modal view
         * and child view on exit.
         */
        initialize: function(options) {
            options = _.extend({
                autoDestroy: true,
                exitOnBackdropClick: true,
                exitOnEscapeKey: true
            }, options);

            this.template = _.template(modal_template);
            this.viewOrFactory = options.viewOrFactory;
            this.title = options.title;
            this.autoDestroy = options.autoDestroy;
            this.exitOnBackdropClick = options.exitOnBackdropClick;
            this.exitOnEscapeKey = options.exitOnEscapeKey;

            //callbacks
            this.ok = options.ok;
            this.save = options.save;
            this.cancel = options.cancel;
            this.close = options.close;
            this.action = options.action;
            
            //child views
            this.view = null;
            this.initChildViews();
        },

        initChildViews: function() {
            if(this.viewOrFactory instanceof core.factory.Factory) {
                this.view = this.viewOrFactory.create();
            } else {
                this.view = this.viewOrFactory;
            }
        },

        childViews: function() {
            return [this.view];
        },

        context: function() {
            return {
                title: this.title,
                action: this.view.action,
                showClose: _.isFunction(this.view.onClose),
                showCancel: _.isFunction(this.view.onCancel),
                showOk: _.isFunction(this.view.onOk),
                showSave: _.isFunction(this.view.onSave),
                showAction: _.isFunction(this.view.onAction)
            };
        },

        render: function() {
            var context = this.context();
            this.$el.html(this.template(context));
            this.append(this.view, '.content');

            this.$el.modal({
                backdrop: this.exitOnBackdropClick ? true : 'static',
                keyboard: this.exitOnEscapeKey ? true : false,
                show: true
            });

            return this;
        },

        destroy: function() {
            this.hide();
            ModalView.__super__.destroy.call(this);
        },

        isModal: function() {
            return true;
        },

        show: function() {
            this.$el.modal('show');
        },

        hide: function() {
            this.$el.modal('hide');
        },

        onClose: function() {
            if(this.view.onClose()) {
                this.hide();
                this.triggerEvent(EventType.CLOSE);
                if(_.isFunction(this.close)) {
                    this.close();
                }
                if(this.autoDestroy) {
                    this.destroy();
                }
            }
        },

        onOk: function() {
            if(this.view.onOk()) {
                this.hide();
                this.triggerEvent(EventType.OK);
                if(_.isFunction(this.ok)) {
                    this.ok();
                }
                if(this.autoDestroy) {
                    this.destroy();
                }
            }
        },

        onSave: function() {
            if(this.view.onSave()) {
                this.hide();
                this.triggerEvent(EventType.SAVE);
                if(_.isFunction(this.save)) {
                    this.save();
                }
                if(this.autoDestroy) {
                    this.destroy();
                }
            }
        },

        onAction: function() {
            if(this.view.onAction()) {
                this.hide();
                this.triggerEvent(EventType.ACTION);
                if(_.isFunction(this.action)) {
                    this.action();
                }
                if(this.autoDestroy) {
                    this.destroy();
                }
            }
        },

        onCancel: function() {
            if(this.view.onCancel()) {
                this.hide();
                this.triggerEvent(EventType.CANCEL);
                if(_.isFunction(this.cancel)) {
                    this.cancel();
                }
                if(this.autoDestroy) {
                    this.destroy();
                }
            }
        }

    });
    
    return {
        EventType: EventType,
        ModalView: ModalView
    };
});
