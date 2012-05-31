define([
    'Underscore',
    'common/notifications',
    'core/mediator',
    'chat/whiteboard/proxies',
    'chat/whiteboard/views',
    'chat/user/proxies',
], function(
    _,
    notifications,
    mediator,
    whiteboard_proxies,
    whiteboard_views,
    user_proxies) {


    var WhiteboardTabMediator = mediator.Mediator.extend({
        name: function() {
            return WhiteboardTabMediator.NAME;
        },

        notifications: [
        ],

        initialize: function(options) {
            this.whiteboardsProxy = this.facade.getProxy(whiteboard_proxies.ChatWhiteboardsProxy.NAME);
            this.usersProxy = this.facade.getProxy(user_proxies.ChatUsersProxy.NAME);

            this.view = new whiteboard_views.ChatWhiteboardTabView({
                users: this.usersProxy.collection,
                collection: this.whiteboardsProxy.collection,
            });

            this.facade.trigger(notifications.VIEW_CREATED, {
                type: 'WhiteboardTabView',
                view: this.view
            });
        },

    }, {

        NAME: 'WhiteboardTabMediator',
    });

    return {
        WhiteboardTabMediator: WhiteboardTabMediator,
    }
});
