define([
    'jquery',
    'underscore',
    'core',
    'events',
    '../drop/views',
    '../template/views',
    'text!./templates/menu.html'
], function(
    $,
    _,
    core,
    events,
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

            this.triggerEvent(events.type.EventType.SELECT, {
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

        events: {
            'select .drop-content': 'onSelect'
        },

        initialize: function(options) {
            var view = new core.factory.Factory(MenuView, {
                collection: options.collection
            });
            delete options.collection;

            options = _.extend({
                view: view
            }, options);

            drop_views.DropView.prototype.initialize.call(this, options);
        },

        onSelect: function(e) {
            this.close();
        }
    });

    return {
        EVENTS: EVENTS,
        MenuView: MenuView,
        DropMenuView: DropMenuView
    };
});
