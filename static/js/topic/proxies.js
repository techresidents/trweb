define([
    'common/notifications',
    'core/proxy'
], function(notifications, proxy) {

    /**
     * Topics Collection Proxy
     * @constructor
     * @param {Object} options
     *   {TopicCollection} collection
     */
    var TopicsProxy = proxy.CollectionProxy.extend({

        name: 'TopicsProxy',

        eventNotifications: {
            'add': notifications.TOPIC_ADDED,
            'change': notifications.TOPIC_CHANGED,
            'remove': notifications.TOPIC_REMOVED
        },

        initialize: function(options) {
        },
        
        next: function(topic) {
            var result = null;
            if(topic) {
                var index = this.collection.indexOf(topic);
                if(index < this.collection.length - 1) {
                    result = this.collection.at(index + 1);
                }
            } else {
                result = this.collection.first();
            }

            return result;
        },

        isLeaf: function(topic) {
            if(topic) {
                return this.collection.isLeaf(topic.id);
            } else {
                return false;
            }
        }

    });
    
    return {
        TopicsProxy: TopicsProxy
    };
});
