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
     * UpdateRequisition constructor
     * @constructor
     * @classdesc
     * Update requisition
     */
    var UpdateRequisition = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute Command
         * @param {object} options
         * @param {User} options.model Requisition model to update
         * @param {function} [options.onSuccess] Success callback
         * @param {function} [options.onError] Error callback
         */
        execute: function(options) {
            var model = options.model;
            var currentUser = new api.models.User({id: 'CURRENT'});
            model.set_tenant_id(currentUser.get_tenant_id());
            if(!model.get_user_id()) {
                model.set_user_id(currentUser.id);
            }
            
            model.save(null, {
                wait: true,
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this)
            });

            return true;
        }
    });

    /**
     * UpdateRequisitionTechnologies constructor
     * @constructor
     * @classdesc
     * Update requisition technologies
     */
    var UpdateRequisitionTechnologies = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['collection'],

        /**
         * Execute Command
         * @param {object} options
         * @param {RequisitionTechnologyCollection} options.collection
         *   Requisition technology collection
         * @param {function} [options.onSuccess] Success callback
         * @param {function} [options.onError] Error callback
         */
        execute: function(options) {
            var collection = options.collection;

            collection.save({
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this)
            });

            return true;
        }

    });

    /**
     * SaveRequisition constructor
     * @constructor
     * @classdesc
     * Save requisition
     */
    var SaveRequisition = core.command.AsyncCommand.extend({

        /**
         * Execute Command
         * @param {object} options
         * @param {User} options.model User model to update.
         *   Note that changes to DeveloperProfile will also
         *   be updated.
         * @param {function} [options.onSuccess] Success callback
         * @param {function} [options.onError] Error callback
         */
        execute: function(options) {
            var model = options.model;
            var updateRequisition = Q.defer();

            this.facade.trigger(notifications.UPDATE_REQUISITION, {
                model: model,
                onSuccess: updateRequisition.resolve,
                onError: updateRequisition.reject
            });

            var that = this;
            updateRequisition.promise
            .then(function(result) {
                var updateRequisitionTechnologies = Q.defer();

                model.get_requisition_technologies().each( function(requisition_technology) {
                    requisition_technology.set_requisition_id(model.id);
                });

                that.facade.trigger(notifications.UPDATE_REQUISITION_TECHNOLOGIES, {
                    collection: model.get_requisition_technologies(),
                    onSuccess: updateRequisitionTechnologies.resolve,
                    onError: updateRequisitionTechnologies.reject
                });
                return updateRequisitionTechnologies.promise;
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
        UpdateRequisition: UpdateRequisition,
        UpdateRequisitionTechnologies: UpdateRequisitionTechnologies,
        SaveRequisition: SaveRequisition
    };
});
