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
     *   targetView: {View} (optional)
     *   targetSelector {String} (optional)
     *   autoclose: {Boolean} (optional)
     *   autocloseGroup: {String} (optional)
     */
    var DropView = view.View.extend({

        defaultTemplate: drop_template,

        events: {
        },

        childViews: function() {
            return [this.childView];
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
            this.autocloseGroup = options.autocloseGroup || 'default';
            this.viewConfig = options.view;
            this.targetView = options.targetView;
            this.targetSelector = options.targetSelector;
            this.childView = null;
            this.isOpen = false;
            
            //child views
            this.childView = this.createChildView(this.viewConfig);
            
        },

        delegateEventName: function(eventName) {
            //use delegate events so they're removed on destroy()
            return eventName + '.delegateGlobalEvents' + this.cid;
        },

        undelegateGlobalEvents: function() {
            $('html').off(this.delegateEventName(''));
        },

        delegateEvents: function() {
            view.View.prototype.delegateEvents.apply(this, arguments);
            if(this.autoclose) {
                //close the action menu if click happens outside of a .drop-button
                $('html').on(this.delegateEventName('click'), _.bind(this.onClick, this));

                //handle drop opened event so we can close if another drop has been opened
                $('html').on(this.delegateEventName(EVENTS.DROP_OPENED), _.bind(this.onDropOpened, this));
            }
        },

        undelegateEvents: function() {
            this.undelegateGlobalEvents();
            view.View.prototype.undelegateEvents.apply(this, arguments);
        },

        classes: function() {
            var result = ['drop'];
            if(this.targetView) {
                result.push('drop-absolute');
            }
            return result;
        },

        target: function() {
            var result;
            if(this.targetView) {
                result = this.targetView.$(this.targetSelector);
            }
            return result;
        },

        render: function() {
            var context = _.extend({
                cid: this.cid
            }, base.getValue(this, 'context', this));

            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.childView, '.drop-content');
            return this;
        },

        createChildView: function(config) {
            var options = _.extend({
            }, base.getValue(config, 'options'));

            return new config.ctor(options);
        },

        position: function() {
            var offset, parentOffset;
            var target = this.target();
            if(target) {
                offset = target.offset();
                offset.top += target.outerHeight();

                //find first parent with absolute/relative position and get its offset
                //so we can negate it in order to position next to the target.
                parentOffset = this.$el.offsetParent().offset();
                if(parentOffset) {
                    offset.top -= parentOffset.top;
                    offset.left -= parentOffset.left;
                }
                this.$el.css(offset);
            }
        },

        open: function() {
            var inner = this.$('.drop-inner:first');
            if(!this.isOpen) {
                this.position();
                inner.addClass('drop-open');
                this.isOpen = !this.isOpen;
                this.triggerEvent(EVENTS.DROP_OPENED, this);
            }
        },

        close: function() {
            var inner = this.$('.drop-inner:first');
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

        onClick: function(e) {
            if(!this.isOpen || !this.autoclose) {
                return;
            }

            var target = $(e.target);

            var inDom = target.closest(document.documentElement).length ? true : false;
            var inDropButton = target.closest('.drop-button').length ? true : false;
            var inDropContent = false;
            var dropContent = target.closest('.drop-content');
            if(dropContent.length) {
                if(dropContent.first().data('cid') === this.cid) {
                    inDropContent = true;
                }
            }

            //check to see if the target is in the dom.
            //child view click events which result in a re-render of the drop view
            //will no longer be in the dom so we can't check to see if its
            //part of the .drop-content, so ignore all events from views 
            //not in the dom.
            if(inDom && !inDropButton && !inDropContent) {
                this.close();
            }
        },

        onDropOpened: function(e, view) {
            if(this.autoclose &&
               view.cid !== this.cid &&
               view.autocloseGroup === this.autocloseGroup) {
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
