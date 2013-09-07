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
     * AcceptInterviewOffer constructor
     * @constructor
     * @classdesc
     * Accept an interview offer
     */
    var AcceptInterviewOffer = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        // Shown if when no onError callback is provided
        defaultErrorMessage: 'Unexpected error. Failed to accept offer. Please try again.',

        /**
         * Execute command
         * @param {object} options Options object
         * @param {object} options.model InterviewOffer model to rescind.
         * @param {object} options.application Application model
         * @param {string} [options.applicationStatus='INTERVIEW_OFFER_ACCEPTED']
         *  New application status.
         * @param {function} [options.onSuccess] Success callback
         * @param {function} [options.onError] Error callback
         */
        execute: function(options) {
            var model = options.model;
            var application = options.application;
            var applicationStatus = options.applicationStatus ||
                'INTERVIEW_OFFER_ACCEPTED';

            var success = function() {
                application.get_interview_offers().add(model);
                this.facade.trigger(notifications.UPDATE_APPLICATION_STATUS, {
                    model: application,
                    status: applicationStatus,
                    onSuccess: _.bind(this.onSuccess, this)
                });
            };

            model.save({
                status: 'ACCEPTED'
            }, {
                success: _.bind(success, this)
            });

            return true;
        }
    });

    /**
     * DeclineInterviewOffer constructor
     * @constructor
     * @classdesc
     * Reject an interview offer
     */
    var DeclineInterviewOffer = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        // Shown if when no onError callback is provided
        defaultErrorMessage: 'Unexpected error. Failed to decline offer. Please try again.',

        /**
         * Execute command
         * @param {object} options Options object
         * @param {object} options.model InterviewOffer model to rescind.
         * @param {object} options.application Application model
         * @param {string} [options.applicationStatus='INTERVIEW_OFFER_DECLINED']
         *  New application status.
         * @param {function} [options.onSuccess] Success callback
         * @param {function} [options.onError] Error callback
         */
        execute: function(options) {
            var model = options.model;
            var application = options.application;
            var applicationStatus = options.applicationStatus ||
                'INTERVIEW_OFFER_DECLINED';

            var success = function() {
                application.get_interview_offers().add(model);
                this.facade.trigger(notifications.UPDATE_APPLICATION_STATUS, {
                    model: application,
                    status: applicationStatus,
                    onSuccess: _.bind(this.onSuccess, this)
                });
            };

            model.save({
                status: 'DECLINED'
            }, {
                success: _.bind(success, this)
            });

            return true;
        }
    });

    return {
        AcceptInterviewOffer: AcceptInterviewOffer,
        DeclineInterviewOffer: DeclineInterviewOffer
    };
});