define([
    'jquery',
    'underscore',
    'core/base',
    'core/view',
    'text!drop/templates/drop.html',
    'text!drop/templates/drop_menu.html'
], function(
    $,
    _,
    base,
    view,
    drop_template,
    drop_menu_template) {

    var EVENTS = {
        DROP_OPENED: 'DROP_OPENED_EVENT',
        DROP_CLOSED: 'DROP_CLOSED_EVEND',
        DROP_MENU_SELECTED: 'DROP_MENU_SELECTED_EVENT'
    };

    /**
     * Drop View.
     * @constructor
     * @param {Object} options
     *   view: {Object} Content view options (required)
     */
    var DropView = view.View.extend({

        defaultTemplate: drop_template,

        events: {
        },

        childViews: function() {
            return [this.childView];
        },

        delegateEventName: function(eventName) {
            //use delegate events so they're removed on destroy()
            return eventName + '.delegateGlobalEvents' + this.cid;
        },

        undelegateGlobalEvents: function() {
            $('html').off(this.delegateEventName(''));
        },

        destroy: function() {
            this.undelegateGlobalEvents();
            view.View.prototype.destroy.apply(this, arguments);
        },

        initialize: function(options) {
            options = _.extend({
                autoclose: true,
                template: this.defaultTemplate,
                context: {}
            }, options);
            
            this.template = _.template(options.template);
            this.context = options.context;
            this.autoclose = options.autoclose;
            this.viewConfig = options.view;
            this.childView = null;
            this.isOpen = false;
            
            if(this.autoclose) {
                //close the action menu if click happens outside of a .drop-button
                $('html').on(this.delegateEventName('click'), _.bind(this.onClose, this));

                //handle drop opened event so we can close if another drop has been opened
                $('html').on(this.delegateEventName(EVENTS.DROP_OPENED), _.bind(this.onDropOpened, this));
            }
        },

        classes: function() {
            return ['drop'];
        },

        render: function() {
            var context = _.extend({}, base.getValue(this, 'context', this));

            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            this.destroyChildViews();
            this.childView = this.createChildView(this.viewConfig).render();
            this.$('.drop-content').html(this.childView.el);
            return this;
        },

        createChildView: function(config) {
            var options = _.extend({
            }, base.getValue(config, 'options'));

            return new config.ctor(options);
        },

        open: function() {
            var inner = this.$('.drop-inner');
            if(!this.isOpen) {
                inner.addClass('drop-open');
                this.isOpen = !this.isOpen;
                this.triggerEvent(EVENTS.DROP_OPENED, this);
            }
        },

        close: function() {
            var inner = this.$('.drop-inner');
            if(this.isOpen) {
                inner.removeClass('drop-open');
                this.isOpen = !this.isOpen;
                this.triggerEvent(EVENTS.DROP_CLOSED, this);
            }
        },

        toggle: function() {
            if(this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        },

        onClose: function(e) {
            if(!this.isOpen) {
                return;
            }

            var target = $(e.target);
            if(!target.hasClass('drop-button')) {
                this.close();
            }
        },

        onDropOpened: function(e, view) {
            if(view.cid !== this.cid) {
                this.close();
            }
        }
    });

    /**
     * Drop Menu Component View
     * @constructor
     * @param {Object} options
     *   view: {Object} Content view options (required)
     */
    var DropMenuComponentView = view.View.extend({

        defaultTemplate: drop_menu_template,

        events: {
            'click .drop-menu-item': 'onItemClick'
        },

        initialize: function(options) {
            options = _.extend({
                template: this.defaultTemplate
            }, options);

            this.template = _.template(options.template);
            this.context = options.context;
            this.items = options.items;
            this.itemMap = {};

            _.each(this.items, function(item) {
                this.itemMap[item.key] = item;
            }, this);
        },

        classes: function() {
            return ['drop-menu'];
        },

        render: function() {
            var context = _.extend({
                items: this.items
            }, base.getValue(this, 'context', this));

            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        },

        onItemClick: function(e) {
            var item = this.itemMap[$(e.currentTarget).data('item')];
            var handled = false;
            if(item.hasOwnProperty('handler')) {
                handled = item.handler.call(this, item);
            }
            if(!handled) {
                this.triggerEvent(EVENTS.DROP_MENU_SELECTED, item);
            }
        }
    });

    /**
     * Drop Menu Component View
     * @constructor
     * @param {Object} options
     *   items: {Array} menu item objects (required)
     */
    var DropMenuView = DropView.extend({
        initialize: function(options) {
            options = _.extend({
                items: []
            }, options);

            DropView.prototype.initialize.call(this, {
                view: {
                    ctor: DropMenuComponentView,
                    options: options
                }
            });
        }
    });

    return {
        EVENTS: EVENTS,
        DropView: DropView,
        DropMenuView: DropMenuView
    };

});
