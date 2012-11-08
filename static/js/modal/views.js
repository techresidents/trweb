define([
    'jquery',
    'underscore',
    'core/view',
    'text!modal/templates/modal.html'
], function($, _, view, modal_template) {

    /**
     * Modals View Events
     */
    var EVENTS = {
        CLOSE: 'modal:Close',
        OK: 'modal:Ok',
        SAVE: 'modal:Save',
        CANCEL: 'modal:Cancel'
    };

    /**
     * Modal view.
     * @constructor
     * @param {Object} options
     *   {Backbone.View} view 
     *   {string} title
     *   {boolean} exitOnBackdropClick (optional default true)
     *   {boolean} exitOnEscapeKey (optional default true)
     */
    var ModalView = view.View.extend({

        viewSelector: '#content',

        events: {
            'click .close': 'onClose',
            'click .ok': 'onOk',
            'click .save': 'onSave',
            'click .cancel': 'onCancel'
        },

        initialize: function(options) {
            this.template = _.template(modal_template);
            this.view = options.view;
            this.title = options.title;
            this.buttonMask = options.buttonMask || 0;
            this.exitOnBackdropClick = options.exitOnBackdropClick !== undefined ? options.exitOnBackdropClick : true;
            this.exitOnEscapeKey = options.exitOnEscapeKey !== undefined ? options.exitOnEscapeKey : true;
        },

        render: function() {
            var state = {
                title: this.title,
                showClose: _.isFunction(this.view.onClose),
                showCancel: _.isFunction(this.view.onCancel),
                showOk: _.isFunction(this.view.onOk),
                showSave: _.isFunction(this.view.onSave)
            };

            this.$el.html(this.template(state));

            this.$(this.viewSelector).html(this.view.render().el);

            this.$el.modal({
                backdrop: this.exitOnBackdropClick ? true : 'static',
                keyboard: this.exitOnEscapeKey ? true : false,
                show: true
            });

            return this;
        },

        onClose: function() {
            if(this.view.onClose()) {
                this.$el.modal('hide');
                this.triggerEvent(EVENTS.CLOSE);
                this.$el.remove();
            }
        },

        onOk: function() {
            if(this.view.onOk()) {
                this.$el.modal('hide');
                this.triggerEvent(EVENTS.OK);
                this.$el.remove();
            }
        },

        onSave: function() {
            if(this.view.onSave()) {
                this.$el.modal('hide');
                this.triggerEvent(EVENTS.SAVE);
                this.$el.remove();
            }
        },

        onCancel: function() {
            if(this.view.onCancel()) {
                this.$el.modal('hide');
                this.triggerEvent(EVENTS.CANCEL);
                this.$el.remove();
            }
        }

    });
    
    return {
        EVENTS: EVENTS,
        ModalView: ModalView
    };
});
