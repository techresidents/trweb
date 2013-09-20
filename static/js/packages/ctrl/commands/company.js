define([
    'underscore',
    'q',
    'api',
    'core',
    'notifications',
    '../proxies/current'
], function(
    _,
    Q,
    api,
    core,
    notifications,
    current_proxies) {

    /**
     * UpdateTenant constructor
     * @constructor
     * @classdesc
     * Update Tenant model. Only the tenant name
     * can be changed. The tenant domain should
     * never be updated after registration, since
     * the domain name is derived from the user's
     * email address.
     */
    var UpdateTenant = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute Command
         * @param {object} options
         * @param {Tenant} options.model Tenant model to update
         * @param {function} [options.onSuccess] Success callback
         * @param {function} [options.onError] Error callback
         */
        execute: function(options) {
            var model = options.model;
            model.save({
                name: model.get_name()
                // Don't change tenant domain. Ever.
            }, {
                wait: true,
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this)
            });

            return true;
        }
    });

    /**
     * UpdateCompanyProfile constructor
     * @constructor
     * @classdesc
     * Update CompanyProfile model.
     */
    var UpdateCompanyProfile = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute Command
         * @param {object} options
         * @param {CompanyProfile} options.model CompanyProfile model to update
         * @param {function} [options.onSuccess] Success callback
         * @param {function} [options.onError] Error callback
         */
        execute: function(options) {
            var model = options.model;
            model.save(null, {
                wait: true,
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this)
            });

            return true;
        }
    });

    /**
     * SaveCompanyProfile constructor
     * @constructor
     * @classdesc
     * Save company profile
     */
    var SaveCompanyProfile = core.command.AsyncCommand.extend({

        /**
         * Execute Command
         * @param {object} options
         * @param {Tenant} options.model Tenant model to update.
         *   Note that changes to CompanyProfile will also
         *   be updated.
         * @param {function} [options.onSuccess] Success callback
         * @param {function} [options.onError] Error callback
         */
        execute: function(options) {
            var model = options.model;
            var updateTenant = Q.defer();
            this.facade.trigger(notifications.UPDATE_TENANT, {
                model: model,
                onSuccess: updateTenant.resolve,
                onError: updateTenant.reject
            });

            var that = this;
            updateTenant.promise
            .then(function(result) {
                var updateCompanyProfile = Q.defer();
                that.facade.trigger(notifications.UPDATE_COMPANY_PROFILE, {
                    model: model.get_company_profile(),
                    onSuccess: updateCompanyProfile.resolve,
                    onError: updateCompanyProfile.reject
                });
                return updateCompanyProfile.promise;
            })
            .then(_.bind(this.promiseSuccess, this),
                  _.bind(this.promiseError, this))
            .done();
        },

        promiseSuccess: function(result) {
            this.onSuccess();
        },

        promiseError: function(result) {
            this.onError();
        }
    });

    return {
        UpdateTenant: UpdateTenant,
        UpdateCompanyProfile: UpdateCompanyProfile,
        SaveCompanyProfile: SaveCompanyProfile
    };
});
