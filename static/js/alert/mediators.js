define([
    'underscore',
    'common/notifications',
    'core/mediator',
    'alert/models',
    'alert/views'
], function(
    _,
    notifications,
    mediator,
    alert_models,
    alert_views) {

    var AlertMediator = mediator.Mediator.extend({

        name: function() {
            return AlertMediator.NAME;
        },

        viewType: function() {
            return AlertMediator.VIEW_TYPE;
        },


        notifications: [
            [notifications.ALERT, 'onAlert'], // deprecated
            [notifications.VIEW_CREATE, 'onCreateView'],
            [notifications.VIEW_DESTROY, 'onDestroyView']
        ],

        initialize: function(options) {
            this.view = null;
        },

        _createView: function(notification) {
            this.view = new alert_views.AlertView({
                model: new alert_models.AlertValueObject({
                    severity: notification.severity,
                    message: notification.message,
                    style: notification.style
                })
            });

            this.facade.trigger(notifications.VIEW_CREATED, {
                type: this.viewType(),
                view: this.view,
                options: notification.options
            });
        },

        onAlert: function(notification) {
            this._createView(notification);
        },

        onCreateView: function(notification) {
            if(notification.type === this.viewType()) {
                this._createView(notification);
            }
        },

        onDestroyView: function(notification) {
            if(notification.type === this.viewType()) {
                notification.view.destroy();

                this.facade.trigger(notifications.VIEW_DESTROYED, {
                    type: this.viewType(),
                    view: notification.view
                });

                if(this.view === notification.view) {
                    this.view = null;
                }
            }
        }

    }, {
        NAME: 'AlertMediator',
        VIEW_TYPE: 'AlertView'
    });

    return {
        AlertMediator: AlertMediator
    };
});
