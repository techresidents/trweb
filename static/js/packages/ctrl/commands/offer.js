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
         * @param {object} options.model InterviewOffer model to accept.
         * @param {object} options.application Application model
         * @param {function} [options.onSuccess] Success callback
         * @param {function} [options.onError] Error callback
         */
        execute: function(options) {
            var model = options.model;
            var application = options.application;
            var success = function() {
                application.get_interview_offers().add(model);
                this.onSuccess.apply(this, arguments);
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
         * @param {object} options.model InterviewOffer model to decline.
         * @param {object} options.application Application model
         * @param {function} [options.onSuccess] Success callback
         * @param {function} [options.onError] Error callback
         */
        execute: function(options) {
            var model = options.model;
            var application = options.application;

            var success = function() {
                application.get_interview_offers().add(model);
                this.onSuccess.apply(this, arguments);
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
