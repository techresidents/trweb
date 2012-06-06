define([
    'Underscore',
    'common/notifications',
    'core/mediator',
    'chat/agenda/proxies',
    'chat/tag/models',
    'chat/tag/proxies',
    'chat/tag/views',
    'chat/user/proxies',
], function(
    _,
    notifications,
    mediator,
    agenda_proxies,
    tag_models,
    tag_proxies,
    tag_views,
    user_proxies) {


    var TaggerMediator = mediator.Mediator.extend({
        name: function() {
            return TaggerMediator.NAME;
        },

        notifications: [
            [notifications.CHAT_STARTED, 'onChatStarted'],
            [notifications.CHAT_ENDED, 'onChatEnded'],
        ],

        initialize: function(options) {
            this.agendaProxy = this.facade.getProxy(agenda_proxies.ChatAgendaProxy.NAME);
            this.tagsProxy = this.facade.getProxy(tag_proxies.ChatTagsProxy.NAME);
            this.usersProxy = this.facade.getProxy(user_proxies.ChatUsersProxy.NAME);

            this.view = new tag_views.ChatTaggerView({
                users: this.usersProxy.collection,
                collection: this.tagsProxy.collection
            });

            //add events listeners
            this.view.addEventListener(tag_views.EVENTS.ADD_TAG, this.onAdd, this);
            this.view.addEventListener(tag_views.EVENTS.DELETE_TAG, this.onDelete, this);

            this.facade.trigger(notifications.VIEW_CREATED, {
                type: 'ChatTaggerView',
                view: this.view
            });
        },

        onChatStarted: function(notification) {
            this.view.enable(true);
        },

        onChatEnded: function(notification) {
            this.view.enable(false);
        },

        onAdd: function(e, eventBody) {
            this.facade.trigger(notifications.TAG_CREATE, {
                name: eventBody.tagValue
            });
        },

        onDelete: function(e, eventBody) {
            this.facade.trigger(notifications.TAG_DELETE, {
                model: eventBody.tagModel
            });
        },

    }, {

        NAME: 'TaggerMediator',
    });

    return {
        TaggerMediator: TaggerMediator,
    }
});