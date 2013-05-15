define([
    'underscore',
    'api',
    'core',
    '../proxies/current'
], function(
    _,
    api,
    core,
    current_proxies) {


    /**
     * TakeNote constructor
     * @constructor
     * @classdesc
     * Take a note on an applicant.
     */
    var TakeNote = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute command
         * @param {object} options Options object
         * @param {object} [options.model] JobNote model to create.
         * This is not required if model attributes below are provided.
         * @param {string} [options.candidate_id] JobNote model candidate_id.
         * This is not required if model is provided with attribute.
         * @param {string} [options.note] JobNote model note value.
         * This is not required if model is provided with attribute.
         * @param {function} [options.onSuccess] Success callback
         * @param {function} [options.onError] Error callback
         */
        execute: function(options) {
            var currentProxy = this.facade.getProxy(
                current_proxies.CurrentProxy.NAME);
            var currentUser = currentProxy.currentUser();
            var model = options.model || new api.models.JobNote();

            var attributes = _.defaults({
                tenant_id: currentUser.get_tenant_id(),
                employee_id: currentUser.id,
                candidate_id: options.candidate_id,
                note: options.note
            }, model.attributes);

            model.save(attributes, {
                wait: true,
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this)
            });

            return true;
        }
    });

    return {
        TakeNote: TakeNote
    };
});
