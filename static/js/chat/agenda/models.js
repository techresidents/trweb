define([
    'jQuery',
    'Underscore',
    'Backbone',
    'topic/models',
    'chat/minute/models',
], function($, _, Backbone, topic_models, minute_models) {
    
    var Agenda = Backbone.Model.extend({
                
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

        topic: function(topicId) {
            return this.topics().get(topicId);
        },
        
        topics: function() {
            return this.get('topics');
        },

        isLeaf: function(topic) {
            if(topic) {
                return this.topics().isLeaf(topic.id);
            } else {
                return false;
            }
        },

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

        nextActive: function(topic) {
            if(topic) {
                return this.topics().findLeaf(topic.id);
            } else {
                var first = this.topics().first();
                return this.topics().findLeaf(first.id);
            }
        },

        selectedIndex: function() {
            return this.get('selectedIndex');
        },

        selected: function() {
            return this.get('selected');
        },

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

        selectNext: function() {
            if(this.selectedIndex() < this.topics().length - 1) {
                var index = this.selectedIndex() + 1;
                this.select(this.topics().at(index));
            } else {
                this.select(null);
            }
        },

        activeIndex: function() {
            return this.get('activeIndex');
        },

        active: function() {
            return this.get('active');
        },

        
        activateNext: function() {
            var active = this.active();

            var closeLevel = this._startMinutes(active);
            
            if(active) {
                this._endMinutes(active.rank(), closeLevel);   
            }
        },

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

        _startMinutes: function(active) {
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
                        break;
                    } else {
                        closeLevel = Math.min(closeLevel, topic.level());
                    }
                } else {
                    closeLevel = 0;
                    break;
                }
            }
            return closeLevel;
        },

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

        _minuteAdded: function(minute) {
            minute.bind('change', this._minuteChanged, this);
            var topic = this.topic(minute.topicId());
            if(this.isLeaf) {
                this._activate(topic);
            }
        },

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
