define([
    'underscore',
    'api',
    'core',
    'notifications',
    '../proxies/current'
], function(
    _,
    api,
    core,
    notifications,
    current_proxies) {

    /**
     * CreateApplication constructor
     * @constructor
     * @classdesc
     * Create a new Application.
     */
    var CreateApplication = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute command
         * @param {object} options Options object
         * @param {object} [options.model] Application model to create.
         * This is not required if model attributes below  are provided.
         * @param {string} [options.user_id] Application model user_id.
         * This is not required if model is provided with attribute.
         * @param {string} [options.tenant_id] Application model tenant_id.
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
            var model = options.model || new api.models.Application();
            
            var attributes = _.defaults({}, model.attributes, {
                requisition_id: options.requisition_id,
                user_id: options.user_id,
                tenant_id: options.tenant_id
            }, model.attributes);
            
            attributes.creator_id = currentUser.id;
            attributes.status = 'REVIEW';
            if(currentUser.id === model.user_id) {
                attributes.type = 'CANDIDATE';
            } else {
                attributes.type = 'EMPLOYEE_EVENT';
                attributes.tenant_id = currentUser.get_tenant_id();
            }

            model.save(attributes, {
                wait: true,
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
    var UpdateApplicationStatus = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute command
         * @param {object} options Options object
         * @param {object} options.model Application model to update.
         * @param {object} [options.status] New application status.
         * Not required if model contains updated status.
         * @param {function} [options.onSuccess] Success callback 
         * @param {function} [options.onError] Error callback 
         */
        execute: function(options) {
            var model = options.model;
            var attributes = _.defaults({
                status: options.status
            }, model.attributes);

            var success = function() {
                this.onSuccess();
                this.facade.trigger(notifications.CREATE_APPLICATION_LOG, {
                    application: model,
                    note: 'Status changed to ' + options.status
                });
            };

            model.save(attributes, {
                wait: true,
                success: _.bind(success, this),
                error: _.bind(this.onError, this)
            });
            return true;
        }
    });

    /**
     * ScoreApplicant constructor
     * @constructor
     * @classdesc
     * Score an applicant.
     */
    var ScoreApplicant = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute command
         * @param {object} options Options object
         * @param {object} options.application Application model.
         * @param {object} [options.model] ApplicationScore model to create.
         * This is not required if model attributes below are provided.
         * @param {string} [options.technical_score] ApplicationScore model
         * technical_score.  This is not required if model is provided
         * with attribute.
         * @param {string} [options.communication_score] ApplicationScore model
         * communication_score.  This is not required if model is provided
         * with attribute.
         * @param {string} [options.cultural_fit_score] ApplicationScore model
         * cultural_fit_score.  This is not required if model is provided
         * with attribute.
         * @param {function} [options.onSuccess] Success callback
         * @param {function} [options.onError] Error callback
         */
        execute: function(options) {
            var currentProxy = this.facade.getProxy(
                current_proxies.CurrentProxy.NAME);
            var currentUser = currentProxy.currentUser();
            var application = options.application;
            var model = options.model || new api.models.ApplicationScore();

            var attributes = _.defaults({
                tenant_id: currentUser.get_tenant_id(),
                user_id: currentUser.id,
                application_id: application.id,
                technical_score: options.technical_score,
                communication_score: options.communication_score,
                cultural_fit_score: options.cultural_fit_score
            }, model.attributes);

            // For convenience, update the applications scores collection
            var success = function(model) {
                var scores = application.get_application_scores();
                scores.add(model);
                this.onSuccess();
            };

            model.save(attributes, {
                wait: true,
                success: _.bind(success, this),
                error: _.bind(this.onError, this)
            });

            return true;
        }
    });

    /**
     * CastApplicantVote constructor
     * @constructor
     * @classdesc
     * Vote on an applicant.
     */
    var CastApplicantVote = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute command
         * @param {object} options Options object
         * @param {object} options.application Application model.
         * @param {object} [options.model] ApplicationVote model to create.
         * This is not required if model attributes below are provided.
         * @param {string} [options.yes] ApplicationVote model vote value.
         * This is not required if model is provided with attribute.
         * @param {function} [options.onSuccess] Success callback
         * @param {function} [options.onError] Error callback
         */
        execute: function(options) {
            var currentProxy = this.facade.getProxy(
                current_proxies.CurrentProxy.NAME);
            var currentUser = currentProxy.currentUser();
            var application = options.application;
            var model = options.model || new api.models.ApplicationScore();

            var attributes = _.defaults({
                tenant_id: currentUser.get_tenant_id(),
                user_id: currentUser.id,
                application_id: application.id
            }, model.attributes);

            // Since vote value can be null,  _.defaults() could overwrite
            // the options.yes attribute. Thus, we explicitly set the
            // value here.
            if (options.hasOwnProperty('yes')) {
                attributes.yes = options.yes;
            }

            // For convenience, update the applications votes collection
            var success = function(model) {
                var votes = application.get_application_votes();
                votes.add(model);
                this.onSuccess();
            };

            model.save(attributes, {
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
    var CreateApplicationLog = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute command
         * @param {object} options Options object
         * @param {object} options.application Application model to create
         * log entry for.
         * @param {object} [options.model] ApplicationLog model to create.
         * This is not required if model attributes below are provided.
         * @param {string} [options.note] Application log note.
         * This is not required if model is provided with attribute.
         * @param {function} [options.onSuccess] Success callback 
         * @param {function} [options.onError] Error callback 
         */
        execute: function(options) {
            var currentProxy = this.facade.getProxy(
                current_proxies.CurrentProxy.NAME);
            var currentUser = currentProxy.currentUser();
            var application = options.application;
            var model = options.model || new api.models.ApplicationLog();
            var attributes = _.defaults({
                note: options.note
            }, model.attributes);

            var success = function() {
                application.get_application_logs().add(model);
                this.onSuccess();
            };
            
            attributes.user_id = currentUser.id;
            attributes.tenant_id = currentUser.get_tenant_id();
            attributes.application_id = application.id;

            model.save(attributes, {
                success: _.bind(success, this),
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
    var MakeInterviewOffer = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute command
         * @param {object} options Options object
         * @param {object} options.application Application model
         * @param {object} [options.model] InterviewOffer model to create
         * This is not required if model attributes below are provided.
         * @param {string} [options.type] InterviewOffer type.
         * This is not required if model is provided with attribute.
         * @param {date} [options.expires] InterviewOffer expires date.
         * This is not required if model is provided with attribute.
         * @param {function} [options.onSuccess] Success callback 
         * @param {function} [options.onError] Error callback 
         */
        execute: function(options) {
            var currentProxy = this.facade.getProxy(
                current_proxies.CurrentProxy.NAME);
            var currentUser = currentProxy.currentUser();
            var application = options.application;
            var model = options.model || new api.models.InterviewOffer();
            var attributes = _.defaults({
                type: options.type,
                expires: options.expires
            }, model.attributes);

            var success = function() {
                application.get_interview_offers().add(model);

                this.facade.trigger(notifications.UPDATE_APPLICATION_STATUS, {
                    model: application,
                    status: 'INTERVIEW_OFFER_PENDING',
                    onSuccess: _.bind(this.onSuccess, this)
                });
            };

            attributes.application_id = application.id;
            attributes.employee_id = currentUser.id;
            attributes.tenant_id = currentUser.get_tenant_id();
            attributes.candidate_id = application.get_user_id();
            attributes.status = 'PENDING';

            model.save(attributes, {
                success: _.bind(success, this),
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
    var RescindInterviewOffer = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute command
         * @param {object} options Options object
         * @param {object} options.application Application model
         * @param {object} options.model InterviewOffer model to rescind.
         * @param {string} [options.applicationStatus] New application status.
         * @param {function} [options.onSuccess] Success callback 
         * @param {function} [options.onError] Error callback 
         */
        execute: function(options) {
            var currentProxy = this.facade.getProxy(
                current_proxies.CurrentProxy.NAME);
            var currentUser = currentProxy.currentUser();
            var application = options.application;
            var model = options.model;
            var applicationStatus = options.applicationStatus;

            var success = function() {
                application.get_interview_offers().add(model);
                this.facade.trigger(notifications.UPDATE_APPLICATION_STATUS, {
                    model: application,
                    status: applicationStatus,
                    onSuccess: _.bind(this.onSuccess, this)
                });
            };

            model.save({
                status: 'RESCINDED'
            }, {
                success: _.bind(success, this),
                error: _.bind(this.onError, this)
            });

            return true;
        }
    });
    
    return {
        CreateApplication: CreateApplication,
        UpdateApplicationStatus: UpdateApplicationStatus,
        ScoreApplicant: ScoreApplicant,
        CastApplicantVote: CastApplicantVote,
        CreateApplicationLog: CreateApplicationLog,
        MakeInterviewOffer: MakeInterviewOffer,
        RescindInterviewOffer: RescindInterviewOffer
    };
});
