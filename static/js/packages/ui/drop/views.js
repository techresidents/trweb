define([
    'jquery',
    'underscore',
    'core',
    'core/view',
    '../events/type',
    'text!./templates/drop.html',
    'text!./templates/drop_menu.html'
], function(
    $,
    _,
    core,
    view,
    events,
    drop_template,
    drop_menu_template) {
    
    var EVENTS = {
    };

    /**
     * Drop View.
     * @constructor
     * @param {Object} options
     *   view: {Object} view View or view Factory (required)
     *   targetView: {View} (optional)
     *   targetSelector {String} (optional)
     *   autoclose: {Boolean} (optional)
     *   autocloseGroup: {String} (optional)
     */
    var DropView = core.view.View.extend({

        defaultTemplate: drop_template,

        events: {
        },

        childViews: function() {
            return [this.childView];
        },

        initialize: function(options) {
            options = _.extend({
                autoclose: true,
                useTargetWidth: false,
                template: this.defaultTemplate,
                context: {}
            }, options);
            
            this.template = _.template(options.template);
            this.context = options.context;
            this.autoclose = options.autoclose;
            this.autocloseGroup = options.autocloseGroup || 'default';
            this.useTargetWidth = options.useTargetWidth;
            this.view = options.view;
            this.targetView = options.targetView;
            this.targetSelector = options.targetSelector;
            this.childView = null;
            
            //child views
            this.childView = this.createChildView(this.view);
            
        },

        delegateEventName: function(eventName) {
            //use delegate events so they're removed on destroy()
            return eventName + '.delegateGlobalEvents' + this.cid;
        },

        undelegateGlobalEvents: function() {
            $('html').off(this.delegateEventName(''));
        },

        delegateEvents: function() {
            core.view.View.prototype.delegateEvents.apply(this, arguments);
            if(this.autoclose) {
                //close the action menu if click happens outside of a .drop-button
                $('html').on(this.delegateEventName('click'), _.bind(this.onClick, this));

                //handle drop opened event so we can close if another drop has been opened
                $('html').on(this.delegateEventName(events.OPEN), _.bind(this.onDropOpened, this));
            }
        },

        undelegateEvents: function() {
            this.undelegateGlobalEvents();
            core.view.View.prototype.undelegateEvents.apply(this, arguments);
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
            if(this.targetView && this.targetSeelector) {
                result = this.targetView.$(this.targetSelector);
            } else if(this.targetView) {
                result = this.targetView.$el;
            }
            return result;
        },

        render: function() {
            var context = _.extend({
                cid: this.cid
            }, core.base.getValue(this, 'context', this));

            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.childView, '.drop-content');
            return this;
        },

        createChildView: function(viewOrFactory) {
            var view;
            if(viewOrFactory instanceof core.factory.Factory) {
                view = viewOrFactory.create();
            } else {
                view = viewOrFactory;
            }
            return view;
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

        setWidth: function() {
            if(!this.useTargetWidth) {
                return;
            }

            var content = this.$('.drop-content');
            var contentWidth = content.width();
            var contentOuterWidth = content.outerWidth();
            var contentExtraWidth = contentOuterWidth - contentWidth;
            var targetOuterWidth = this.target().outerWidth(false);
            content.width(targetOuterWidth - contentExtraWidth);
        },

        isOpen: function() {
            var inner = this.$('.drop-inner:first');
            return inner.hasClass('drop-open');
        },

        open: function() {
            var inner = this.$('.drop-inner:first');
            if(!this.isOpen()) {
                this.position();
                this.setWidth();
                inner.addClass('drop-open');
                this.triggerEvent(events.OPEN, {
                    view: this
                });
            }
        },

        close: function() {
            var inner = this.$('.drop-inner:first');
            if(this.isOpen()) {
                inner.removeClass('drop-open');
                this.triggerEvent(events.CLOSE, {
                    view: this
                });
            }
        },

        toggle: function() {
            if(this.isOpen()) {
                this.close();
            } else {
                this.open();
            }
        },

        onClick: function(e) {
            if(!this.isOpen() || !this.autoclose) {
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

        onDropOpened: function(e, eventBody) {
            var view = eventBody ? eventBody.view : null;
            if(this.autoclose &&
               view &&
               view.cid !== this.cid &&
               view.autocloseGroup === this.autocloseGroup) {
                this.close();
            }
        }
    });

    return {
        EVENTS: EVENTS,
        DropView: DropView
    };

});
