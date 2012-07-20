define([
    'Underscore',
    'common/notifications',
    'core/mediator',
    'chat/feedback/models',
    'chat/feedback/views',
    'chat/session/proxies',
    'modal/views'
], function(
    _,
    notifications,
    mediator,
    feedback_models,
    feedback_views,
    session_proxies,
    modal_views) {

    /**
     * Feedback Mediator
     * @constructor
     * @param {Object} options
     */
    var FeedbackMediator = mediator.Mediator.extend({
        name: 'FeedbackMediator',
        
        /**
         * Notification handlers
         */
        notifications: [],

        initialize: function(options) {
            this.proxy = this.facade.getProxy(session_proxies.ChatSessionProxy.NAME);

            this.view = new modal_views.ModalView({
                title: 'Chat Feedback',
                exitOnBackdropClick: false,
                exitOnEscapeKey: false,
                view: new feedback_views.FeedbackModalView({
                    model: new feedback_models.Feedback({
                        chatSessionId: this.proxy.sessionId
                    })
                })
            });
        },
        
        display: function() {
            this.view.render();
        }
    });

    return {
        FeedbackMediator: FeedbackMediator
    };
});
