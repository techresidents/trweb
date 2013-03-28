define([
    'underscore',
    'api/models',
    'common/notifications',
    'core/command',
    'current/proxies',
    'talent/applicant/mediators',
    'talent/notifications'
], function(
    _,
    api,
    notifications,
    command,
    current_proxies,
    applicant_mediators,
    talent_notifications) {

    /**
     * CreateApplication constructor
     * @constructor
     * @classdesc
     * Create a new Application.
     */
    var CreateApplication = command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute command
         * @param {object} options Options object
         * @param {object} [options.model] Application model to create.
         * This is not required if optional attribute options are provided.
         * @param {string} [options.user_id] Application model user_id.
         * This is not required if model is provided with attribute.
         * @param {string} [options.requisition_id] Application model
         * requisition_id.  This is not required if model is provided
         * with attribute.
         * @param {function} [options.onSuccess] Success callback 
         * @param {function} [options.onError] Error callback 
         */
        execute: function(options) {
            var currentProxy = this.facade.getProxy(
                current_proxies.CurrentProxy.NAME);
            var currentUser = currentProxy.currentUser();
            var model = options.model || new api.Application();
            
            attributes = _.defaults({}, model.attributes, {
                requisition_id: options.requisition_id,
                user_id: options.user_id,
                tenant_id: options.tenant_id
            });
            
            attributes.state = 'REVIEW';
            if(currentUser.id === model.user_id) {
                attributes.type = 'CANDIDATAE';
            } else {
                attributes.type = 'EMPLOYEE_EVENT';
                attributes.tenant_id = currentUser.get_tenant_id();
            }
            
            model.save(attributes, {
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this)
            });

            return true;
        }
    });
    
    /**
     * UpdateApplicationStatus constructor
     * @constructor
     * @classdesc
     * Update an en existing application's status
     */
    var UpdateApplicationStatus = command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute command
         * @param {object} options Options object
         * @param {object} options.model Application model to update
         * @param {object} options.status New application status
         * @param {function} [options.onSuccess] Success callback 
         * @param {function} [options.onError] Error callback 
         */
        execute: function(options) {
            var model = options.model;
            var success = function() {
                this.onSuccess();
                this.facade.trigger(talent_notifications.CREATE_APPLICATION_LOG, {
                    application: model,
                    note: 'Status changed to ' + options.status
                });
            };

            model.save({status: options.status}, {
                wait: true,
                success: _.bind(success, this),
                error: _.bind(this.onError, this)
            });
            return true;
        }
    });

    /**
     * CreateApplicationLog constructor
     * @constructor
     * @classdesc
     * Create a new application log entry.
     */
    var CreateApplicationLog = command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute command
         * @param {object} options Options object
         * @param {object} options.model Application model to create log for.
         * @param {function} [options.onSuccess] Success callback 
         * @param {function} [options.onError] Error callback 
         */
        execute: function(options) {
            var currentProxy = this.facade.getProxy(
                current_proxies.CurrentProxy.NAME);
            var currentUser = currentProxy.currentUser();
            var model = options.model || new api.ApplicationLog();
            var application = options.application;

            model.set_user_id(currentUser.id);
            model.set_tenant_id(currentUser.get_tenant_id());
            model.set_application_id(application.id);

            if(options.note) {
                model.set_note(options.note);
            }

            model.save(null, {
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this)
            });
            return true;
        }
    });

    /**
     * MakeInterviewOffer constructor
     * @constructor
     * @classdesc
     * Create a new interview offer
     */
    var MakeInterviewOffer = command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute command
         * @param {object} options Options object
         * @param {object} options.model InterviewOffer model
         *   Required model attributes: type, expires 
         * @param {object} options.application Application model
         * @param {function} [options.onSuccess] Success callback 
         * @param {function} [options.onError] Error callback 
         */
        execute: function(options) {
            var currentProxy = this.facade.getProxy(
                current_proxies.CurrentProxy.NAME);
            var currentUser = currentProxy.currentUser();
            var model = options.model;
            var application = options.application;

            var updateApplicationStatus = function() {
                application.get_interview_offers().add(model);

                this.facade.trigger(talent_notifications.UPDATE_APPLICATION_STATUS, {
                    model: application,
                    status: 'INTERVIEW_OFFERED',
                    onSuccess: _.bind(this.onSuccess, this)
                });
            };

            model.save({
                application_id: application.id,
                employee_id: currentUser.id,
                tenant_id: currentUser.get_tenant_id(),
                candidate_id: application.get_user_id(),
                status: 'PENDING'
            }, {
                success: _.bind(updateApplicationStatus, this),
                error: _.bind(this.onError, this)
            });

            return true;
        }
    });

    /**
     * RescindInterviewOffer constructor
     * @constructor
     * @classdesc
     * Rescind an interview offer
     */
    var RescindInterviewOffer = command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute command
         * @param {object} options Options object
         * @param {object} options.model InterviewOffer model
         *   Required model attributes: type, expires 
         * @param {object} options.application Application model
         * @param {function} [options.onSuccess] Success callback 
         * @param {function} [options.onError] Error callback 
         */
        execute: function(options) {
            var currentProxy = this.facade.getProxy(
                current_proxies.CurrentProxy.NAME);
            var currentUser = currentProxy.currentUser();
            var model = options.model;
            var application = options.application;
            var applicationStatus = options.applicationStatus;

            var updateApplicationStatus = function() {
                application.get_interview_offers().add(model);
                this.facade.trigger(talent_notifications.UPDATE_APPLICATION_STATUS, {
                    model: application,
                    status: applicationStatus,
                    onSuccess: _.bind(this.onSuccess, this)
                });
            };

            model.save({
                status: 'RESCINDED'
            }, {
                success: _.bind(updateApplicationStatus, this),
                error: _.bind(this.onError, this)
            });

            return true;
        }
    });
    
    /**
     * ShowMakeInterviewOffer constructor
     * @constructor
     * @classdesc
     * Create and show interview offer view
     */
    var ShowMakeInterviewOffer = command.Command.extend({

        /**
         * Execute Command
         * @param {object} options Options object
         * @param {object} options.model Application model
         * @param {function} [options.onSuccess] Success callback 
         * @param {function} [options.onError] Error callback 
         *
         * @return {boolean} true on success, false otherwise.
         */
        execute: function(options) {
            var Mediator = applicant_mediators.OfferMediator;
            this.facade.trigger(notifications.VIEW_CREATE, {
                type: Mediator.VIEW_TYPE.MAKE_INTERVIEW_OFFER,
                options: {
                    model: options.model
                }
            });
            return true;
        }
    });

    /**
     * ShowRescindInterviewOffer constructor
     * @constructor
     * @classdesc
     * Rescind interview offer view
     */
    var ShowRescindInterviewOffer = command.Command.extend({

        /**
         * Execute Command
         * @param {object} options Options object
         * @param {object} options.model Application model
         * @param {function} [options.onSuccess] Success callback 
         * @param {function} [options.onError] Error callback 
         *
         * @return {boolean} true on success, false otherwise.
         */
        execute: function(options) {
            var Mediator = applicant_mediators.OfferMediator;
            this.facade.trigger(notifications.VIEW_CREATE, {
                type: Mediator.VIEW_TYPE.RESCIND_INTERVIEW_OFFER,
                options: {
                    model: options.model
                }
            });
            return true;
        }
    });

    return {
        CreateApplication: CreateApplication,
        UpdateApplicationStatus: UpdateApplicationStatus,
        CreateApplicationLog: CreateApplicationLog,
        MakeInterviewOffer: MakeInterviewOffer,
        RescindInterviewOffer: RescindInterviewOffer,
        ShowMakeInterviewOffer: ShowMakeInterviewOffer,
        ShowRescindInterviewOffer: ShowRescindInterviewOffer
    };
});
