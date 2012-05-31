define([
    'Underscore',
    'common/notifications',
    'core/mediator',
    'alert/models',
    'alert/views',
], function(
    _,
    notifications,
    mediator,
    alert_models,
    alert_views) {

    var AlertMediator = mediator.Mediator.extend({
        name: 'AlertMediator',
        
        notifications: [
            [notifications.ALERT, 'onAlert'],
        ],

        initialize: function(options) {
        },

        onAlert: function(notification) {
            var view = new alert_views.AlertView({
                model: new alert_models.AlertValueObject({
                    severity: notification.severity,
                    message: notification.message,
                })
            });

            this.facade.trigger(notifications.VIEW_CREATED, {
                type: 'AlertView',
                view: view,
            });
        },
    });

    return {
        AlertMediator: AlertMediator,
    }
});
