define([
    'underscore',
    'notifications',
    'core',
    'ctrl',
    'api',
    './views'
], function(
    _,
    notifications,
    core,
    ctrl,
    api,
    views) {

    /**
     * Developer Event Mediator
     * @constructor
     */
    var DeveloperEventMediator = core.mediator.Mediator.extend({

        name: function() {
            return DeveloperEventMediator.NAME;
        },

        isViewType: function(type) {
            return _.contains(DeveloperEventMediator.VIEW_TYPE, type);
        },

        /**
         * Notification handlers
         */
        notifications: [
            [notifications.VIEW_CREATE, 'onCreateView'],
            [notifications.VIEW_DESTROY, 'onDestroyView']
        ],

        initialize: function(options) {
            this.view = null;
        },

        createRegisterView: function(options) {
            return new views.DeveloperEventRegisterView();
        },

        onCreateView: function(notification) {
            if(!this.isViewType(notification.type)) {
                return;
            }

            var view;
            switch(notification.type) {
                case DeveloperEventMediator.VIEW_TYPE.REGISTER:
                    view = this.createRegisterView(notification.options);
                    break;
            }

            this.facade.trigger(notifications.VIEW_CREATED, {
                type: notification.type,
                view: view,
                options: notification.options
            });
        },

        onDestroyView: function(notification) {
            if(this.isViewType(notification.type)) {
                notification.view.destroy();
                this.facade.trigger(notifications.VIEW_DESTROYED, {
                    type: notification.type,
                    view: notification.view
                });
            }
        }

    }, {

        NAME: 'DeveloperEventMediator',

        VIEW_TYPE: {
            REGISTER: 'DeveloperEventRegisterView'
        }
    });

    return {
        DeveloperEventMediator: DeveloperEventMediator
    };
});
