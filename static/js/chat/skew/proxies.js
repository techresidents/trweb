define([
    'common/notifications',
    'core/proxy',
    'chat/user/proxies'
], function(notifications, proxy, user_proxies) {

    /**
     * Chat Skew Proxy
     * @constructor
     * @param {Object} options
     *   {MarkerCollection} collection
     */
    var ChatSkewProxy = proxy.Proxy.extend({

        name: function() {
            return ChatSkewProxy.NAME;
        },
        
        initialize: function(options) {
            this.skew = 0;
            this.usersProxy = this.facade.getProxy(user_proxies.ChatUsersProxy.NAME);
            this.currentUser = this.usersProxy.currentUser();
        },

        getSkew: function() {
            return this.skew;
        },
        
        getSkewMs: function() {
            return this.getSkew() * 1000;
        },

        calculateSkew: function() {
            var that = this;
            var onSuccess = function(model, response) {
                var msg = response.result.response.msg;
                that.skew = msg.marker.skew;
                this.facade.trigger(notifications.SKEW_CALCULATED, {
                    skew: that.skew
                });
            };

            this.facade.trigger(notifications.MARKER_SKEW_CREATE, {
                userId: this.currentUser.id,
                userTimestamp: (new Date()).getTime() / 1000,
                onSuccess: onSuccess
            });
        }

    }, {

        NAME: 'ChatSkewProxy'
    });
    
    return {
        ChatSkewProxy: ChatSkewProxy
    };
});
