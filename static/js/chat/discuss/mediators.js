define([
    'Underscore',
    'common/notifications',
    'core/mediator',
    'chat/agenda/proxies',
    'chat/discuss/models',
    'chat/discuss/views',
    'chat/tag/proxies',
    'chat/tag/views',
    'chat/user/proxies'
], function(
    _,
    notifications,
    mediator,
    agenda_proxies,
    discuss_models,
    discuss_views,
    tag_proxies,
    tag_views,
    user_proxies) {

    /**
     * Discuss Mediator
     * @constructor
     * @param {Object} options
     */
    var DiscussMediator = mediator.Mediator.extend({
        name: function() {
            return DiscussMediator.NAME;
        },
        
        /**
         * Notification handlers
         */
        notifications: [
            [notifications.CHAT_TOPIC_CHANGED, 'onChatTopicChanged'],
            [notifications.CHAT_STARTED, 'onChatStarted'],
            [notifications.CHAT_ENDED, 'onChatEnded'],
        ],

        initialize: function(options) {
            this.agendaProxy = this.facade.getProxy(agenda_proxies.ChatAgendaProxy.NAME);
            this.tagsProxy = this.facade.getProxy(tag_proxies.ChatTagsProxy.NAME);
            this.usersProxy = this.facade.getProxy(user_proxies.ChatUsersProxy.NAME);

            this.view = new discuss_views.DiscussView({
                users: this.usersProxy.collection,
                tags: this.tagsProxy.collection,
                model: new discuss_models.DiscussValueObject({
                    rootTopic: this.agendaProxy.topics().first(),
                    activeTopic: this.agendaProxy.active(),
                    nextTopic: this.agendaProxy.nextActive(),
                })
            });

            //vew event listeners
            this.view.addEventListener(discuss_views.EVENTS.NEXT, this.onNextTopic, this);
            this.view.addEventListener(discuss_views.EVENTS.START, this.onStartTopic, this);
            this.view.addEventListener(tag_views.EVENTS.ADD_TAG, this.onAddTag, this);
            this.view.addEventListener(tag_views.EVENTS.DELETE_TAG, this.onDeleteTag, this);
            
            //notify system of view creation
            this.facade.trigger(notifications.VIEW_CREATED, {
                type: 'DiscussView',
                view: this.view
            });
        },

        onChatTopicChanged: function(notification) {
            this.view.model.setActiveTopic(notification.topic);
        },

        onChatStarted: function(notification) {
            this.view.taggerView.enable(true);
        },

        onChatEnded: function(notification) {
            this.view.taggerView.enable(false);
        },

        onNextTopic: function(e) {
            this.facade.trigger(notifications.CHAT_NEXT_TOPIC);
        },

        onStartTopic: function(e) {
            this.facade.trigger(notifications.CHAT_NEXT_TOPIC);
        },

        onAddTag: function(e, eventBody) {
            this.facade.trigger(notifications.TAG_CREATE, {
                name: eventBody.tagValue
            });
        },

        onDeleteTag: function(e, eventBody) {
            this.facade.trigger(notifications.TAG_DELETE, {
                model: eventBody.tagModel
            });
        },

    },{
        NAME: 'DiscussMediator',
    });

    return {
        DiscussMediator: DiscussMediator,
    }
});
