define([
    'Underscore',
    'common/notifications',
    'core/command',
    'chat/proxies',
    'chat/agenda/proxies',
    'chat/minute/models',
    'chat/minute/proxies',
], function(
    _,
    notifications,
    command,
    chat_proxies,
    agenda_proxies,
    minute_models,
    minute_proxies) {
    
    var ChatConnectCommand = command.Command.extend({
        execute: function(options) {
            var chatProxy = this.facade.getProxy(chat_proxies.ChatProxy.NAME);
            chatProxy.connect();
        }
    });

    var ChatStartCommand = command.Command.extend({
        execute: function(options) {
        }
    });

    var ChatEndCommand = command.Command.extend({
        execute: function(options) {
        }
    });

    var ChatNextTopicCommand = command.Command.extend({
        execute: function(options) {
            this.agendaProxy = this.facade.getProxy(agenda_proxies.ChatAgendaProxy.NAME);
            this.minutesProxy = this.facade.getProxy(minute_proxies.ChatMinutesProxy.NAME);
            
            var activeTopic = this.agendaProxy.active();
            var nextActiveTopic = this.agendaProxy.nextActive(activeTopic);
            var closeLevel = this._startMinutes(activeTopic);
            if(activeTopic) {
                this._endMinutes(activeTopic.rank(), closeLevel);
            }
            
            this.agendaProxy.activate(nextActiveTopic);

        },

        /**
         * Start chat Minutes for next active Topic.
         * This will result in the creation of chat Minute's
         * for all topics following the currently active topic,
         * up to and including the next leaft topic.
         * @param {Topic} active Currently active Topic model.
         * @return {number} Topic level for which preceding
         * Minutes need to be closed. A level of 1 indicates
         * that all Topics with rank <= active().rank() and
         * and level >= 1 can be closed.
         */
        _startMinutes: function(active) {
            var topicsProxy = this.agendaProxy.topicsProxy;

            //close level indicates the topic level for 
            //which preceding topics (lower rank) need
            //to have their Minute's closed.
            var closeLevel = null;
            if(active) {
                closeLevel = active.level();
            }

            var topic = active;
            while(true) {
                topic = topicsProxy.next(topic);
                if(topic) {
                    var minute = new minute_models.Minute({
                        topicId: topic.id
                    });
                    minute.save();

                    if(topicsProxy.isLeaf(topic)) {
                        //found leaf topic to activate, so break.
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
            var minutesProxy = this.agendaProxy.minutesProxy;
            var topicsProxy = this.agendaProxy.topicsProxy;

            var minutes = minutesProxy.collection.filter(function(minute) {
               var topic = topicsProxy.get(minute.topicId()); 
               if(!minute.get('endTimestamp') &&
                  topic.rank() <= rank && 
                  topic.level() >= level) {
                       return true;
               } else {
                   return false;
               }
            }, this);

            _.each(minutes, function(minute) {
                minute.save();
            });
        },

    });

    return {
        ChatConnectCommand: ChatConnectCommand,
        ChatStartCommand: ChatStartCommand,
        ChatEndCommand: ChatEndCommand,
        ChatNextTopicCommand: ChatNextTopicCommand,
    };
});
