define([
    'underscore',
    'common/notifications',
    'core/command',
    'current/proxies',
    'talent/applicant/mediators',
    'talent/notifications'
], function(
    _,
    notifications,
    command,
    current_proxies,
    applicant_mediators,
    talent_notifications) {

    /**
     * ApplicationCreate constructor
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
         * @param {object} options.model Application model to create.
         * Required model attributes: user_id, requisition_id 
         * @param {function} [options.onSuccess] Success callback 
         * @param {function} [options.onError] Error callback 
         */
        execute: function(options) {
            var currentProxy = this.facade.getProxy(
                current_proxies.CurrentProxy.NAME);
            var currentUser = currentProxy.currentUser();
            var model = options.model;

            if(currentUser.id === model.user_id) {
                model.set_type('CANDIDATAE');
            } else {
                model.set_type('EMPLOYEE_EVENT');
            }

            if(!model.get_status()) {
                model.set_status('NEW');
            }

            model.save(null, {
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
            model.save({status: options.status}, {
                wait: true,
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
        MakeInterviewOffer: MakeInterviewOffer,
        RescindInterviewOffer: RescindInterviewOffer,
        ShowMakeInterviewOffer: ShowMakeInterviewOffer,
        ShowRescindInterviewOffer: ShowRescindInterviewOffer
    };
});
