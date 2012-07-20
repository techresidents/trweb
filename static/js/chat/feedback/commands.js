define([
    'common/notifications',
    'core/command',
    'chat/feedback/mediators'
], function(
    notifications,
    command,
    feedback_mediators) {

    /**
     * Show Feedback Command
     * @constructor
     *
     * Show Chat Feedback Survey
     */
    var ShowFeedbackCommand = command.Command.extend({

        /**
         * Execute Command
         * @param {Object} options
         *   {function} onSuccess optional success callback
         *   {function} onError optional error callback
         *   {Object} context optional callback context
         *
         * @return {boolean} true on success, false otherwise.
         */
        execute: function(options) {
            var mediator = new feedback_mediators.FeedbackMediator();
            mediator.display();
            return true;
        }
    });

    return {
        ShowFeedbackCommand: ShowFeedbackCommand
    };
});
