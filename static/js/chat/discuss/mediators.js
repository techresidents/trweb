define([
    'underscore',
    'common/notifications',
    'core/mediator',
    'chat/agenda/proxies',
    'chat/discuss/models',
    'chat/discuss/views',
    'chat/skew/proxies',
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
    skew_proxies,
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
            [notifications.USER_PUBLISHING_CHANGED,'onPublishingChanged'],
            [notifications.SKEW_CALCULATED, 'onSkewCalculated']
        ],

        initialize: function(options) {
            var activeTopic;
            this.agendaProxy = this.facade.getProxy(agenda_proxies.ChatAgendaProxy.NAME);
            this.skewProxy = this.facade.getProxy(skew_proxies.ChatSkewProxy.NAME);
            this.tagsProxy = this.facade.getProxy(tag_proxies.ChatTagsProxy.NAME);
            this.usersProxy = this.facade.getProxy(user_proxies.ChatUsersProxy.NAME);

            this.view = new discuss_views.DiscussView({
                users: this.usersProxy.collection,
                tags: this.tagsProxy.collection,
                model: new discuss_models.DiscussValueObject({
                    rootTopic: this.agendaProxy.topics().first(),
                    activeTopic: this.agendaProxy.active(),
                    nextTopic: this.agendaProxy.nextActive(),
                    activeMinute: this.agendaProxy.activeMinute(),
                    skew: this.skewProxy.getSkew()
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
            
            this.view.controlsView.enable(this.usersProxy.currentUser().isPublishing());
        },

        onChatTopicChanged: function(notification) {
            var nextActiveTopic = this.agendaProxy.nextActive(notification.topic);
            this.view.model.setActiveMinute(this.agendaProxy.minute(notification.topic));
            this.view.model.setActiveTopic(notification.topic);
            this.view.model.setNextTopic(nextActiveTopic);

            //disable next button for several seconds
            this.view.controlsView.enable(false);

            var that = this;
            setTimeout(function() {
                if(that.usersProxy.currentUser().isPublishing()) {
                    that.view.controlsView.enable(true);
                }
            }, 4000);
        },

        onChatStarted: function(notification) {
            this.view.taggerView.enable(true);
        },

        onChatEnded: function(notification) {
            this.view.taggerView.enable(false);
        },

        onPublishingChanged: function(notification) {
            this.view.controlsView.enable(this.usersProxy.currentUser().isPublishing());
        },

        onSkewCalculated: function(notification) {
            this.view.model.setSkew(this.skewProxy.getSkew());
        },

        onNextTopic: function(e) {
            this.facade.trigger(notifications.CHAT_NEXT_TOPIC);
        },

        onStartTopic: function(e) {
            this.facade.trigger(notifications.CHAT_NEXT_TOPIC);
        },

        onAddTag: function(e, eventBody) {
            this.facade.trigger(notifications.TAG_CREATE, {
                name: eventBody.tagValue,
                tagReferenceId: eventBody.tagReferenceId,
                conceptId: eventBody.conceptId
            });
        },

        onDeleteTag: function(e, eventBody) {
            this.facade.trigger(notifications.TAG_DELETE, {
                model: eventBody.tagModel
            });
        }

    },{
        NAME: 'DiscussMediator'
    });

    return {
        DiscussMediator: DiscussMediator
    };
});
