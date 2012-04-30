define([
    'jQuery',
    'Underscore',
    'Backbone',
    'topic/models',
    'chat/minute/models',
], function($, _, Backbone, topic_models, minute_models) {
    

    /**
     * Agenda model encapsulates chat topics and keeps track of
     * the active topic. Additionally, this model is responsible
     * for coordinating chat Minute messages upon topic changes.
     * @constructor
     * @param {Object} attributes Optional model attributes
     * @param {Object} options Optional model options.
     */
    var Agenda = Backbone.Model.extend({
        
        /**
         * Agenda model is persisted locally.
         */
        localStorage: new Backbone.LocalStorage('Agenda'),
        
        defaults: function() {
            return {
                selected: null,
                selectedIndex: -1,
                active: null,
                activeIndex: -1,
                topics: new topic_models.TopicCollection
            };
        },
        
        initialize: function(attributes, options) {
            this.minutes = minute_models.minuteCollection;
            this.minutes.bind('add', this._minuteAdded, this);
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
            return this.get('topics');
        },

        /**
         * Returns true if topic is a leaf node, false otherwise.
         * @param {Topic} topic Topic model to test.
         * @return {boolean}
         */
        isLeaf: function(topic) {
            if(topic) {
                return this.topics().isLeaf(topic.id);
            } else {
                return false;
            }
        },
        
        /**
         * Get the Topic model which follows topic.
         * @param {Topic} topic - Topic model.
         * @return {Topic} Returns topic model if exists, null otherwise.
         */
        next: function(topic) {
            if(topic) {
                var index = this.topics().indexOf(topic);
                if(index < this.topics().length - 1) {
                    return this.topics().at(index + 1);
                } else {
                    return null;
                }
            } else {
                return this.topics().first();
            }
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
         * Get the topic collection index of the selected topic.
         * @return {number} index of the selected topic or -1 if none selected.
         */
        selectedIndex: function() {
            return this.get('selectedIndex');
        },

        /**
         * Get the selected topic.
         * @return {Topic} Selected topic or null if none selected.
         */
        selected: function() {
            return this.get('selected');
        },
        
        /**
         * Select the given topic.
         * This will result in a change:selected event.
         * @param {Topic} topic Topic model to select.
         */
        select: function(topic) {
            if(topic !== this.selected()) {
                if(topic) {
                    this.set({
                        selectedIndex: topic.rank(),
                        selected: topic
                    });
                } else {
                    this.set({
                        selectedIndex: -1,
                        selected: null
                    });
                }
            }
        },

        /**
         * Select the next topic.
         * If last topic is selected, selected will move to null.
         *
         * This will result in a change:selected event.
         */
        selectNext: function() {
            if(this.selectedIndex() < this.topics().length - 1) {
                var index = this.selectedIndex() + 1;
                this.select(this.topics().at(index));
            } else {
                this.select(null);
            }
        },

        /**
         * Get the topic collection index for active topic.
         * @return {number} Index of actvie topic or -1 if none active.
         */
        activeIndex: function() {
            return this.get('activeIndex');
        },

        /**
         * Get the active topic.
         * @return {Topic} Active topic or null if none active.
         */
        active: function() {
            return this.get('active');
        },

        /**
         * Active the next topic.
         * Activates the next leaf topic. If the currently active model
         * is the last model, the active model will move to null.
         *
         * This will result in the creation of a new chat Minutes which
         * will be distrubited to all users. Upon receiving the chat 
         * chat Minute from the server, the next topic will be
         * activated and a change:active event will be generated.
         */
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
                    this.set({
                        activeIndex: topic.rank(),
                        active: topic
                    });
                } else {
                    this.set({
                        activeIndex: -1,
                        active: null
                    });
                }
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
            var minutes = this.minutes.filter(function(minute) {
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
            minute.bind('change', this._minuteChanged, this);
            var topic = this.topic(minute.topicId());
            if(this.isLeaf) {
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
    });

    return {
        agenda: new Agenda
    };
});
