define([
    'Underscore',
    'common/notifications',
    'core/proxy',
    'chat/minute/models',
    'chat/minute/proxies',
    'topic/models',
    'topic/proxies'
], function(
    _,
    notifications,
    proxy,
    minute_models,
    minute_proxies,
    topic_models,
    topic_proxies) {
    
    /**
     * Chat Agenda Proxy
     * @constructor
     * @param {Object} attributes
     * @param {Object} options
     *
     * ChatAgendaProxy is responsible for managing the active topic
     * for the chat. Additionally the proxy will start and end
     * chat minutes as the topic is advanced.
     */
    var ChatAgendaProxy = proxy.Proxy.extend({

        name: function() {
            return ChatAgendaProxy.NAME;
        },

        initialize: function(attributes, options) {
            this.activeTopic = null;
            
            //create and register topics proxy
            this.topicCollection = new topic_models.TopicCollection();
            this.topicsProxy = new topic_proxies.TopicsProxy({
                collection: this.topicCollection
            });
            this.facade.registerProxy(this.topicsProxy);
            

            //create and register chat minutes proxy
            this.minuteCollection = new minute_models.MinuteCollection();
            this.minuteCollection.bind('add', this._onMinuteStarted, this);
            this.minuteCollection.bind('change:endTimestamp', this._onMinuteEnded, this);
            this.minutesProxy = new minute_proxies.ChatMinutesProxy({
                collection: this.minuteCollection
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
         * Get the next Topic.
         * @param {Topic} topic - Optional Topic model for
         *      which to calculate the next topic. If not
         *      provided the nex topic relative the currently
         *      active topic will be returned. Note that this
         *      topic may be a parent topic and not a leaf
         *      node.
         *
         * @return {Topic} Returns topic model if exists, null otherwise.
         */
        next: function(topic) {
            topic = topic || this.activeTopic;
            return this.topicsProxy.next(topic);
        },

        /**
         * Get the Topic next inline to become active.
         * @param {Topic} topic - Optional Topic model for which
         *      to calculate the next active topic. If not provided,
         *      the next active topic relative to the currently
         *      active topic will be returned. Note that this will
         *      return the next leaf topic which will be active,
         *      skipping any parent topics.
         * @return {Topic} Returns topic model if exists, null otherwise.
         */
        nextActive: function(topic) {
            topic = topic || this.activeTopic;

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
        
        /**
         * Activate the next chat topic.
         *
         */
        activateNext: function() {
            var activeTopic = this.active();

            //invoke with trigger=false in order to determine
            //the closeLevel, so we can end the currently
            //open minutes before starting the new one.
            var closeLevel = this._startMinutes(activeTopic, false);
            if(activeTopic) {
                this._endMinutes(activeTopic.rank(), closeLevel);
            }

            //really start the minutes
            this._startMinutes(activeTopic, true);
        },

        /**
         * Activate the given topic.
         * @param {Topic} topic
         */
        _activate: function(topic) {
            if(topic && !this.activeTopic) {
                this.facade.trigger(notifications.CHAT_STARTED);
            }

            this.activeTopic = topic;
            this.facade.trigger(notifications.CHAT_TOPIC_CHANGED, {
                topic: topic
            });

            if(!topic) {
                this.facade.trigger(notifications.CHAT_ENDED);
            }
        },
        
        /**
         * Minute started handler
         * @param {Minute} minute
         */
        _onMinuteStarted: function(minute) {
            var topic = this.topicsProxy.get(minute.topicId());
            if(this.topicsProxy.isLeaf(topic)) {
                this._activate(topic);
            }
        },
    
        /**
         * Minute ended handler
         * @param {Minute} minute
         */
        _onMinuteEnded: function(minute) {
            var topic = this.topicsProxy.get(minute.topicId());
            var nextTopic;

            if(this.topicsProxy.isLeaf(topic)) {
                nextTopic = this.next(topic);
                if(!nextTopic) {
                    this._activate(null);
                }
            }
        },

        /**
         * Start chat Minutes for next active Topic.
         * This will result in the creation of chat Minute's
         * for all topics following the currently active topic,
         * up to and including the next leaf topic.
         * @param {Topic} active Currently active Topic model.
         * @param {boolean} trigger if True, MINUTE_START notificationa
         *     will be triggered, otherewise no notifications
         *     will be triggered. Setting trigger to false,
         *     is convenient for determining the close level.
         * @return {number} Topic level for which preceding
         * Minutes need to be closed. A level of 1 indicates
         * that all Topics with rank <= active().rank() and
         * and level >= 1 can be closed.
         */
        _startMinutes: function(active, trigger) {
            //close level indicates the topic level for 
            //which preceding topics (lower rank) need
            //to have their Minute's closed.
            var closeLevel = null;
            if(active) {
                closeLevel = active.level();
            }

            var topic = active;
            while(true) {
                topic = this.topicsProxy.next(topic);
                if(topic) {
                    if(trigger) {
                        this.facade.trigger(notifications.MINUTE_START, {
                            topicId: topic.id
                        });
                    }

                    if(this.topicsProxy.isLeaf(topic)) {
                        //found leaf topic to activate, so break.
                        closeLevel = Math.min(closeLevel, topic.level());
                        break;
                    } else {
                        //found non-leaf topic, so make sure we close
                        //minutes up to this level.
                        closeLevel = Math.min(closeLevel, topic.level());
                    }
                } else {
                    //No more topics, close all open Minute's.
                    closeLevel = 0;
                    break;
                }
            }
            return closeLevel;
        },
    

        /**
         * End all open chat Minutes for given rank and level.
         * This will update the model for the selected Minutes
         * which will result in the server closing the Minute
         * and giving it a valid endTimestamp.
         */
        _endMinutes: function(rank, level) {
            var i;
            var minute;

            var minutes = this.minutesProxy.collection.filter(function(minute) {
               var topic = this.topicsProxy.get(minute.topicId()); 
               if(!minute.get('endTimestamp') &&
                  topic.rank() <= rank && 
                  topic.level() >= level) {
                       return true;
               } else {
                   return false;
               }
            }, this);
            
            //iterate the minutes from back to front
            //so that child minutes are closed before
            //parent minuts.
            for(i = minutes.length - 1; i >= 0; i--) {
                minute = minutes[i];
                this.facade.trigger(notifications.MINUTE_END, {
                    minute: minute
                });
            }
        }

    }, {

        NAME: 'ChatAgendaProxy'
    });

    return {
        ChatAgendaProxy: ChatAgendaProxy
    };
});
