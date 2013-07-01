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
                this.updateCurrentUser(options.user);
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
        },

        updateCurrentUser: function(user) {
            if(user instanceof api.models.User) {
                this.user = user;
            } else {
                this.user = new api.models.User({id: user.id});
                this.user.bootstrap(user);
            }

            //add current user to global session cache which 
            //doesn't expire for 100 days.
            //To get the current user simply
            //execute 'new api.models.User{id: 'CURRENT})'
            var cacheUser = new api.models.User();
            if(this.user) {
                this.user.clone({to: cacheUser});
            }
            cacheUser.session.putModel(cacheUser, api.models.User.key('CURRENT'), 8640000000);
        }

    }, {
        /* NAME */
        NAME: 'CurrentProxy'
    });
    
    return {
        CurrentProxy: CurrentProxy
    };
});
