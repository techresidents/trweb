define([
    'core',
    'api'
], function(
    core,
    api) {

    /**
     * Current Proxy
     * @constructor
     * @param {Object} options
     *   {User} current user model
     */
    var CurrentProxy = core.proxy.Proxy.extend({

        name: function() {
            return CurrentProxy.NAME;
        },
        
        initialize: function(options) {
            this.user = null;
            this.session = new api.session.ApiSession.get();

            if(options.user) {
                if(options.user instanceof api.models.User) {
                    this.user = options.user;
                } else {
                    this.user = new api.models.User({id: options.user.id});
                    this.user.bootstrap(options.user);
                }

                //add current user to global session cache which 
                //doesn't expire for 100 days. The cache user will
                //only have its id and tenant_id to avoid getting
                //out of sync. To get the current user simply
                //execute 'new api.models.User{id: 'CURRENT})'
                var cacheUser = new api.models.User();
                cacheUser.set_id(this.user.id);
                cacheUser.set_tenant_id(this.user.get_tenant_id());
                cacheUser.session.putModel(cacheUser, api.models.User.key('CURRENT'), 8640000000);
            }
        },
        
        /**
         * Return the current user.
         * @return {User}
         */
        currentUser: function() {
            var result = null;
            if (this.user) {
                result = this.user.clone();
            }
            return result;
        }

    }, {
        /* NAME */
        NAME: 'CurrentProxy'
    });
    
    return {
        CurrentProxy: CurrentProxy
    };
});
