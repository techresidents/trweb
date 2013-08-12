define([
    'underscore',
    'notifications',
    'core',
    'api',
    'ctrl',
    'player',
    '../events',
    './views'
], function(
    _,
    notifications,
    core,
    api,
    ctrl,
    player,
    user_events,
    user_views) {

    /**
     * Employer User Mediator
     * @constructor
     */
    var EmployerUserMediator = core.mediator.Mediator.extend({
        name: function() {
            return EmployerUserMediator.NAME;
        },

        viewType: function() {
            return EmployerUserMediator.VIEW_TYPE;
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
        },

        onCreateView: function(notification) {
            if(notification.type === this.viewType()) {
                var user = new api.models.User({
                    id: notification.options.id
                });

                this.view = new user_views.UserView({
                    model: user,
                    playerState: this.playerStateProxy.model
                });

                this.view.addEventListener(this.cid, user_events.PLAY_CHAT, this.onPlay, this);

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
                chat: eventBody.chat
            };
            this.facade.trigger(notifications.PLAYER_PLAY, notificationBody);
        }

    }, {

        NAME: 'EmployerUserMediator',
        
        VIEW_TYPE: 'UserView'
    });

    return {
        EmployerUserMediator: EmployerUserMediator
    };
});
