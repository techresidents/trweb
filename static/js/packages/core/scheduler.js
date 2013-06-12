define([
    'jquery',
    'underscore',
    './array',
    './base'
], function(
    $,
    _,
    array,
    base) {
    
    var eventCompare = function(a, b) {
        return array.defaultCompare(a.offset, b.offset);
    };
    
    var SchedulerClock = base.Base.extend({
        initialize: function(options) {
            this._elapsed = 0;
            this._startTime = null;
        },

        start: function(elapsed) {
            this._elapsed = elapsed || 0;
            this._startTime = new Date();
        },
        
        pause: function() {
            this._elapsed = this.elapsed;
            this._startTime = null;
        },

        resume: function() {
            this._startTime = new Date();
        },

        stop: function() {
            this._elapsed = 0;
            this._startTime = null;
        },

        elapsed: function() {
            var result;
            if(this._startTime) {
                result = (new Date() - this._startTime) + this._elapsed;

            } else {
                result = this.elapsed;
            }
            return result;
        }
    });

    var PlayerClock = base.Base.extend({
        initialize: function(options) {
            this.player = options.player;
        },

        start: function(elapsed) {
        },
        
        pause: function() {
        },

        resume: function() {
        },

        stop: function() {
        },

        elapsed: function() {
            return this.player.offset() * 1000.0;
        }
    });

    var Scheduler = base.Base.extend({

        initialize: function(options) {
            options = options || {};
            this.events = [];
            this.clock = options.clock || new SchedulerClock();
            this.lastElapsed = 0;
            this.nextEventIndex = null;
            this.timer = null;
            this.running = false;
        },
        
        clear:  function() {
            this.events = [];
        },

        add: function(offset, callback) {
            var e = {
                offset: offset,
                callback: callback
            };

            array.binaryInsert(this.events, e, eventCompare);
        },

        start: function(elapsed) {
            this.running = true;
            this.lastElapsed = elapsed || 0;
            this.nextEventIndex = this.nextEvent(this.lastElapsed);
            this.scheduleNextEvent(this.lastElapsed, this.nextEventIndex);
            this.clock.start(elapsed);
        },

        pause: function() {
            this.running = false;
            this.clock.pause();
            if(this.timer) {
                clearTimeout(this.timer);
            }
        },

        resume: function() {
            this.running = true;
            this.scheduleNextEvent(this.lastElapsed, this.nextEventIndex);
            this.clock.resume();
        },

        stop: function() {
            this.running = false;
            this.clock.stop();
            if(this.timer) {
                clearTimeout(this.timer);
            }
        },

        onTimer: function() {
            var i, e;
            var elapsed = this.clock.elapsed();
            if(!_.isNull(this.nextEventIndex)) {
                for(i=this.nextEventIndex; i<this.events.length; i++) {
                    e = this.events[i];
                    if(elapsed > e.offset) {
                        e.callback();
                    } else {
                        break;
                    }
                }
            }
            
            if(elapsed > this.lastElapsed) {
                this.lastElapsed = elapsed;
            }
        
            if(i < this.events.length) {
                this.nextEventIndex = i;
                this.scheduleNextEvent(this.lastElapsed, this.nextEventIndex);
            } else {
                this.timer = null;
            }
        },

        scheduleNextEvent: function(elapsed, eventIndex) {
            if(!this.running) {
                return;
            }

            eventIndex = eventIndex || this.nextEvent(elapsed);
            var nextEvent = this.events[eventIndex];
            if(nextEvent) {
                this.timer = setTimeout(
                    _.bind(this.onTimer, this),
                    Math.max(1000, (nextEvent.offset - this.lastElapsed) / 2.0));
            }
        },

        nextEvent: function(elapsed) {
            var result;
            var target = {
                offset: elapsed || 0
            };
            var index = array.binarySearch(this.events, target, eventCompare);

            if(index >= 0) {
                result = index;
            } else {
                result = -index-1;
            }
            return result;
        }

    });

    return {
        Scheduler: Scheduler,
        SchedulerClock: SchedulerClock,
        PlayerClock: PlayerClock
    };
});
