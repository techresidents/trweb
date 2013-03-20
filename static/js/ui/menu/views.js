define([
    'jquery',
    'underscore',
    'core/base',
    'core/factory',
    'core/view',
    'events/type',
    'ui/drop/views',
    'ui/template/views',
    'text!ui/menu/templates/menu.html'
], function(
    $,
    _,
    base,
    factory,
    view,
    events_type,
    drop_views,
    template_views,
    menu_template) {

    var EVENTS = {
    };

    var MenuView = template_views.TemplateView.extend({

        events: {
            'click .menu-item': 'onItemClick'
        },

        initialize: function(options) {
            options = _.extend({
                template: menu_template
            }, options);

            template_views.TemplateView.prototype.initialize.call(this, options);
        },
        
        classes: function() {
            return ['menu'];
        },

        onItemClick: function(e) {
            var target = this.$(e.currentTarget);
            var model = this.collection.where({key: target.data('key')})[0];
            var handler = model.handler();

            if(handler) {
                handler.call(this, model);
            }

            this.triggerEvent(events_type.EventType.SELECT, {
                model: model
            });
        }
    });

    /**
     * Drop Menu View
     * @constructor
     * @param {Object} options
     *   items: {Array} menu item objects (required)
     */
    var DropMenuView = drop_views.DropView.extend({
        initialize: function(options) {
            var view = new factory.Factory(MenuView, {
                collection: options.collection
            });

            drop_views.DropView.prototype.initialize.call(this, {
                view: view
            });
        }
    });

    return {
        EVENTS: EVENTS,
        MenuView: MenuView,
        DropMenuView: DropMenuView
    };
});
