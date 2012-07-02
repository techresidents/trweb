define([
    'Underscore',
    'common/notifications',
    'core/mediator',
    'chat/agenda/models',
    'chat/agenda/proxies',
    'chat/agenda/views',
    'chat/tag/proxies',
    'chat/user/proxies',
], function(
    _,
    notifications,
    mediator,
    agenda_models,
    agenda_proxies,
    agenda_views,
    tag_proxies,
    user_proxies) {

    /**
     * Agenda Tab Mediator
     * @constructor
     * @param {Object} options
     */
    var AgendaTabMediator = mediator.Mediator.extend({
        name: function() {
            return AgendaTabMediator.NAME;
        },

        /**
         * Notification handlers
         */
        notifications: [
            [notifications.CHAT_TOPIC_CHANGED, 'onChatTopicChanged'],
        ],

        initialize: function(options) {
            this.agendaProxy = this.facade.getProxy(agenda_proxies.ChatAgendaProxy.NAME);
            this.tagsProxy = this.facade.getProxy(tag_proxies.ChatTagsProxy.NAME);
            this.usersProxy = this.facade.getProxy(user_proxies.ChatUsersProxy.NAME);
            
            //create tab view
            this.view = new agenda_views.ChatAgendaTabView({
                users: this.usersProxy.collection,
                tags: this.tagsProxy.collection,
                model: new agenda_models.AgendaValueObject({
                    minutes: this.agendaProxy.minutesProxy.collection,
                    topics: this.agendaProxy.topics(),
                    active: this.agendaProxy.active(),
                    selected: this.agendaProxy.topics().first(),
                })
            });

            //add view events listeners
            this.view.addEventListener(agenda_views.EVENTS.NEXT, this.onNext, this);
            this.view.addEventListener(agenda_views.EVENTS.SELECT, this.onSelect, this);
            this.view.addEventListener(agenda_views.EVENTS.DELETE_TAG, this.onDeleteTag, this);

            //notify system that view is created
            this.facade.trigger(notifications.VIEW_CREATED, {
                type: 'AgendaTabView',
                view: this.view,
            });
        },

        onChatTopicChanged: function(notification) {
            this.view.model.activate(notification.topic);
        },

        onNext: function(e) {
            this.facade.trigger(notifications.CHAT_NEXT_TOPIC);
        },

        onSelect: function(e, eventBody) {
            this.view.model.select(eventBody.topicModel);
        },

        onDeleteTag: function(e, eventBody) {
            this.facade.trigger(notifications.TAG_DELETE, {
                model: eventBody.tagModel
            });
        },

    }, {

        NAME: 'AgendaTabMediator',
    });

    return {
        AgendaTabMediator: AgendaTabMediator,
    }
});
