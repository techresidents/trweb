define([
    'common/notifications',
    'core/proxy',
    'api/models',
    'api/session'
], function(
    notifications,
    proxy,
    api,
    api_session) {

    /**
     * Current Proxy
     * @constructor
     * @param {Object} options
     *   {User} current user model
     */
    var CurrentProxy = proxy.Proxy.extend({

        name: function() {
            return CurrentProxy.NAME;
        },
        
        initialize: function(options) {
            this.user = null;
            this.session = new api_session.ApiSession.get();

            if(options.user) {
                if(options.user instanceof api.User) {
                    this.user = options.user;
                } else {
                    this.user = new api.User({id: options.user.id});
                    this.user.bootstrap(options.user);
                }
            }
        },
        
        /**
         * Return the current user.
         * @return {User}
         */
        currentUser: function() {
            return this.user;
        }

    }, {
        /* NAME */
        NAME: 'CurrentProxy'
    });
    
    return {
        CurrentProxy: CurrentProxy
    };
});
