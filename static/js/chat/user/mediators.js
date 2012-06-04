define([
    'Underscore',
    'common/notifications',
    'core/mediator',
    'chat/session/proxies',
    'chat/user/views',
    'chat/user/proxies',
], function(
    _,
    notifications,
    mediator,
    session_proxies,
    user_views,
    user_proxies) {


    var ChatUsersMediator = mediator.Mediator.extend({
        name: 'ChatUsersMediator',

        notifications: [
            [notifications.USER_CONNECTED_CHANGED, 'onConnectedChanged'],
            [notifications.USER_PUBLISHING_CHANGED,'onPublishingChanged'],
        ],

        initialize: function(options) {
            this.sessionProxy = this.facade.getProxy(session_proxies.ChatSessionProxy.NAME);
            this.usersProxy = this.facade.getProxy(user_proxies.ChatUsersProxy.NAME);
            this.views = {};

            this.usersProxy.collection.each(this.createView, this);
        },

        createView: function(userModel) {
            var view = new user_views.ChatUserView({
                id: userModel.id,
                model: userModel,
                css: 'span' + 12/this.usersProxy.collection.length,
            });

            this.views[userModel.id] = view;
            this.facade.trigger(notifications.VIEW_CREATED, {
                type: 'ChatUserView',
                view: view
            });
        },

        onConnectedChanged: function(notification) {
            var userModel = notification.model;
            var view = this.views[userModel.id];
            
            //Publish stream if this is the current user
            if(userModel.isConnected() && userModel.isCurrentUser()) {
                var details = view.getStreamViewDetails();
                this.sessionProxy.session.publish(details.elementId, {
                    width: details.width,
                    height: details.height,
                    encodedWidth: details.width,
                    encodedHeight: details.height,
                    reportMicLevels: true,
                });
            }
        },

        onPublishingChanged: function(notification) {
            var userModel = notification.model;
            var view = this.views[userModel.id];
            
            //Subscribe to stream if it's not current user
            if(userModel.isPublishing() && !userModel.isCurrentUser()) {
                var details = view.getStreamViewDetails();
                console.log(details);
                this.sessionProxy.session.subscribe(userModel.stream(), details.elementId,  {
                    width: details.width,
                    height: details.height,
                    encodedWidth: details.width,
                    encodedHeight: details.height,
                });
            }
        },

    });

    return {
        ChatUsersMediator: ChatUsersMediator,
    }
});
