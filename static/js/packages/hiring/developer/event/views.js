define([
    'jquery',
    'underscore',
    'core',
    'api',
    'ui',
    'events',
    'text!./templates/register.html'
], function(
    $,
    _,
    core,
    api,
    ui,
    events,
    register_template) {

    var DeveloperEventRegisterView = core.view.View.extend({

        /**
         * Developer event register view
         * @constructs
         * @param {Object} options
         */
        initialize: function(options) {
            this.template = _.template(register_template);
            this.model = new api.models.User({id: 'CURRENT'});
            this.modelWithRelated = ['chats', 'chat_reels', 'skills'];
            this.loader = new api.loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated }
            ]);

            //bind events
            this.listenTo(this.loader, 'loaded', this.render);
            
            //load data
            this.loader.load();
        },

        events: {
            'click button': 'onRegisterClick'
        },

        context: function() {
            return this.model.toJSON({
                withRelated: this.modelWithRelated
            });
        },

        classes: function() {
            return ['developer-event-register'];
        },

        render: function() {
            var context = this.context();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        },

        onRegisterClick: function(e) {
            this.triggerEvent(events.ALERT, {
                severity: 'success',
                message: 'Registration complete. Thank you for registering!'
            });
            this.triggerEvent(events.TRACK_EVENT, {
                category: 'HiringEvent',
                action: 'register'
            });
        }
    });

    return {
        DeveloperEventRegisterView: DeveloperEventRegisterView
    };
});
