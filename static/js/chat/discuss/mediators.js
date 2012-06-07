define([
    'Underscore',
    'common/notifications',
    'core/mediator',
    'chat/agenda/proxies',
    'chat/discuss/models',
    'chat/discuss/views',
], function(
    _,
    notifications,
    mediator,
    agenda_proxies,
    discuss_models,
    discuss_views) {

    /**
     * Discuss Mediator
     * @constructor
     * @param {Object} options
     */
    var DiscussMediator = mediator.Mediator.extend({
        name: 'DiscussMediator',
        
        /**
         * Notification handlers
         */
        notifications: [
            [notifications.CHAT_TOPIC_CHANGED, 'onChatTopicChanged'],
        ],

        initialize: function(options) {
            this.agendaProxy = this.facade.getProxy(agenda_proxies.ChatAgendaProxy.NAME);
            this.view = new discuss_views.DiscussView({
                model: new discuss_models.DiscussValueObject({
                    rootTopic: this.agendaProxy.topics().first(),
                    activeTopic: this.agendaProxy.active(),
                    nextTopic: this.agendaProxy.nextActive(),
                })
            });

            //vew event listeners
            this.view.addEventListener(discuss_views.EVENTS.NEXT, this.onNext, this);
            this.view.addEventListener(discuss_views.EVENTS.START, this.onStart, this);
            
            //notify system of view creation
            this.facade.trigger(notifications.VIEW_CREATED, {
                type: 'DiscussView',
                view: this.view
            });
        },

        onChatTopicChanged: function(notification) {
            this.view.model.setActiveTopic(notification.topic);
        },

        onNext: function(e) {
            this.facade.trigger(notifications.CHAT_NEXT_TOPIC);
        },

        onStart: function(e) {
            this.facade.trigger(notifications.CHAT_NEXT_TOPIC);
        },

    });

    return {
        DiscussMediator: DiscussMediator,
    }
});
