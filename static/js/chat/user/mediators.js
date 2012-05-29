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
            [user_proxies.ChatUsersProxy.USER_CONNECTED, 'onConnected'],
            [user_proxies.ChatUsersProxy.USER_PUBLISHING,'onPublishing'],
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
            this.facade.trigger(notifications.VIEW_CREATED, 'ChatUserView', view);
        },

        onConnected: function(userModel) {
            console.log('onConnected');
            var view = this.views[userModel.id];

            //TODO if this is us - start publishing
            var details = view.getStreamViewDetails();
            this.sessionProxy.session.publish(details.elementId, {
                width: details.width,
                height: details.height,
                encodedWidth: details.width,
                encodedHeight: details.height,
                reportMicLevels: true,
            });
        },

        onPublishing: function(userModel) {
            console.log('onPublishing');
            var view = this.views[userModel.id];

            //TODO if this is not us - subscribe to stream
        },

    });

    return {
        ChatUsersMediator: ChatUsersMediator,
    }
});
