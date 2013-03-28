define([
    'jquery',
    'jquery.bootstrap',
    'underscore',
    'core/factory',
    'core/view',
    'text!ui/modal/templates/modal.html'
], function(
    $,
    none,
    _,
    factory,
    view,
    modal_template) {

    var EventType = {
        CLOSE: 'close',
        OK: 'ok',
        SAVE: 'save',
        CANCEL: 'cancel'
    };

    var ModalView = view.View.extend({

        events: {
            'click .close': 'onClose',
            'click .ok': 'onOk',
            'click .save': 'onSave',
            'click .cancel': 'onCancel'
        },

        /**
         * Modal view.
         * @constructs
         * @param {object} options Options object
         * @param {module:core/view~View|module:core/factory~Factory}
         * options.viewOrFactory View or View factory object
         * @param {string} options.title Modal title
         * @param {function} [options.ok] Ok callback function
         * @param {function} [options.cancel] Cancel callback function
         * @param {function} [options.close] Close callback function
         * @param {function} [options.save] Save callback function
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
            
            //child views
            this.view = null;
            this.initChildViews();
        },

        initChildViews: function() {
            if(this.viewOrFactory instanceof factory.Factory) {
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
                showClose: _.isFunction(this.view.onClose),
                showCancel: _.isFunction(this.view.onCancel),
                showOk: _.isFunction(this.view.onOk),
                showSave: _.isFunction(this.view.onSave)
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
