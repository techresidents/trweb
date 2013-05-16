define([
    'underscore',
    'notifications',
    'core',
    'api',
    'ctrl',
    'player',
    './views'
], function(
    _,
    notifications,
    core,
    api,
    ctrl,
    player,
    user_views) {

    /**
     * User Mediator
     * @constructor
     */
    var UserMediator = core.mediator.Mediator.extend({
        name: function() {
            return UserMediator.NAME;
        },

        viewType: function() {
            return UserMediator.VIEW_TYPE;
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
            this.currentProxy = this.facade.getProxy(
                ctrl.proxies.current.CurrentProxy.NAME);
            this.playerStateProxy = this.facade.getProxy(
                ctrl.proxies.player.PlayerStateProxy.NAME);
            this.session = new api.session.ApiSession.get();
        },

        onCreateView: function(notification) {
            if(notification.type === this.viewType()) {
                var candidate, employee;
                employee = this.currentProxy.currentUser();
                candidate = new api.models.User({
                    id: notification.options.id
                });

                this.view = new user_views.UserView({
                    candidateModel: candidate,
                    employeeModel: employee,
                    playerState: this.playerStateProxy.model
                });

                this.view.addEventListener(this.cid, user_views.EVENTS.PLAY_CHAT, this.onPlay, this);

                this.facade.trigger(notifications.VIEW_CREATED, {
                    type: this.viewType(),
                    view: this.view,
                    options: notification.options
                });
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
        },

        onPlay: function(e, eventBody) {
            var notificationBody = {
                chatSession: eventBody.chatSession,
                chatMinute: eventBody.chatMinute
            };
            this.facade.trigger(notifications.PLAYER_PLAY, notificationBody);
        }

    }, {

        NAME: 'UserMediator',
        
        VIEW_TYPE: 'UserView'
    });

    return {
        UserMediator: UserMediator
    };
});
