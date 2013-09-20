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
            console.log('update profile command');
            console.log(options.model);
            var model = options.model;
            model.save(null, {
                wait: true,
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this)
            });

            return true;
        }
    });

    return {
        UpdateCompanyProfile: UpdateCompanyProfile
    };
});
