define([
    'Underscore',
    'common/notifications',
    'core/proxy',
    'chat/minute/models',
    'chat/minute/proxies',
    'topic/models',
    'topic/proxies',
], function(
    _,
    notifications,
    proxy,
    minute_models,
    minute_proxies,
    topic_models,
    topic_proxies) {
    

    var ChatAgendaProxy = proxy.Proxy.extend({

        name: function() {
            return ChatAgendaProxy.NAME;
        },

        initialize: function(attributes, options) {
            this.activeTopic = null;
            
            this.topicCollection = new topic_models.TopicCollection();
            this.topicsProxy = new topic_proxies.TopicsProxy({
                collection: this.topicCollection,
            });

            this.minuteCollection = new minute_models.MinuteCollection();
            this.minuteCollection.bind('add', this._minuteAdded, this);
            this.minuteCollection.bind('change', this._minuteChanged, this);
            this.minutesProxy = new minute_proxies.ChatMinutesProxy({
                collection: this.minuteCollection,
            });
            this.facade.registerProxy(this.minutesProxy);
        },
        
        /**
         * Get Topic model for given id.
         * @param {number} topicId Topic model id.
         * @return {Topic} Topic model if exists, null otherwise.
         */
        topic: function(topicId) {
            return this.topics().get(topicId);
        },
       
        /**
         * Get topics on the agenda.
         * @return {TopicCollection}
         */
        topics: function() {
            return this.topicCollection;
        },

        
        /**
         * Get the Topic model which follows topic.
         * @param {Topic} topic - Topic model.
         * @return {Topic} Returns topic model if exists, null otherwise.
         */
        next: function(topic) {
            return this.topicsProxy.next(topic);
        },

        /**
         * Get the Topic is next inline to become active.
         * @param {Topic} topic - Topic model.
         * @return {Topic} Returns topic model if exists, null otherwise.
         */
        nextActive: function(topic) {
            if(topic) {
                return this.topics().findLeaf(topic.id);
            } else {
                var first = this.topics().first();
                return this.topics().findLeaf(first.id);
            }
        },
        
        /**
         * Get the active topic.
         * @return {Topic} Active topic or null if none active.
         */
        active: function() {
            return this.activeTopic;
        },

        activate: function(topic) {
            this.activeTopic = topic;

            this.facade.trigger(notifications.CHAT_TOPIC_CHANGED, {
                topic: topic
            });
        },

    }, {

        NAME: 'ChatAgendaProxy',
    });

    return {
        ChatAgendaProxy: ChatAgendaProxy,
    };
});
