define([
    'core/command',
    'chat/minute/proxies',
], function(
    command,
    minute_proxies) {
    
    var StartMinuteCommand = command.Command.extend({
        execute: function(options) {
            var minutesProxy = this.facade.getProxy(minute_proxies.ChatMinutesProxy.NAME);
            var activeMinute = minutesProxy.collection.active();

            if(activeMinute) {
                var tag = new tag_models.Tag({
                    name: options.name,
                    minuteId: activeMinute.id
                });
                tag.save();
            }
        }
    });

    var EndMinuteCommand = command.Command.extend({
        execute: function(options) {
            var minutesProxy = this.facade.getProxy(minute_proxies.ChatMinutesProxy.NAME);
        }
    });

    var NextMinuteCommand = command.Command.extend({
        execute: function(options) {
            var minutesProxy = this.facade.getProxy(minute_proxies.ChatMinutesProxy.NAME);
        }
    });

    return {
        StartMinuteCommand: StartMinuteCommand,
        EndMinuteCommand: StartMinuteCommand,
    };
});



        activateNext: function() {
            var active = this.active();

            var closeLevel = this._startMinutes(active);
            
            if(active) {
                this._endMinutes(active.rank(), closeLevel);   
            }
        },

        /**
         * Activate the given topic.
         * @param {Topic} topic Topic to activate
         * This will result in a change:active event.
         *
         * This method should be invoked directly. Instead,
         * the activateNext method should be used to ensure
         * proper chat Minute logging.
         */
        _activate: function(topic) {
            if(topic !== this.active()) {
                if(topic) {
                    this.activeTopicIndex = topic.rank();
                    this.activeTopic = topic;
                } else {
                    this.activeTopicIndex = -1;
                    this.activeTopic = null;
                }
                this.facade.trigger(ChatAgendaProxy.CHANGE_ACTIVE, this.active());
            }
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
            //close level indicates the topic level for 
            //which preceding topics (lower rank) need
            //to have their Minute's closed.
            var closeLevel = null;
            if(active) {
                closeLevel = active.level();
            }

            var topic = active;
            while(true) {
                topic = this.next(topic);
                if(topic) {
                    var minute = new minute_models.Minute({
                        topicId: topic.id
                    });
                    minute.save();

                    if(this.isLeaf(topic)) {
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
            var minutes = this.minutesProxy.collection.filter(function(minute) {
               var topic = this.topics().get(minute.topicId()); 
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
        
        /**
         * MinuteCollection add handler.
         * Activate the topic indicated by the Minute
         * if the topic is a leaf node.
         */
        _minuteAdded: function(minute) {
            var topic = this.topic(minute.topicId());
            if(this.isLeaf(topic)) {
                this._activate(topic);
            }
        },
        
        /**
         * Minute change handler.
         * Activate null when the root topic is closed, 
         * indicating the end of the chat.
         */
        _minuteChanged: function(minute) {
            var topic = this.topic(minute.topicId());
            if(this.topics().indexOf(topic) == 0) {
                this._activate(null);
            }
        },
