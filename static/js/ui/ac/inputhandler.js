define(/** @exports ui/ac/inputhandler */[
    'jquery',
    'underscore',
    'core/events/type',
    'core/events/keycodes',
    'core/view'
], function(
    $,
    _,
    events_type,
    kc,
    view) {

    var InputHandlerView = view.View.extend(
    /** @lends module:ui/ac/inputhandler~InputHandlerView.prototype */ {
        
        /**
         * InputHandlerView constructor
         * @constructor
         * @augments module:core/view~View
         * @param {object} options Options object
         */
        initialize: function(options) {
            options = _.extend({
                throttle: 150,
                updateDuringTyping: false
            }, options);

            this.inputView = options.inputView;
            this.inputSelector = options.inputSelector;
            this.throttle = options.throttle;
            this.updateDuringTyping = optinos.updateDuringType;
            this._lastInputValue = null;
            this._timer = null;
        },

        delegateEventName: function(eventName) {
            //use delegate events so they're removed on destroy()
            return eventName + '.delegateGlobalEvents' + this.cid;
        },

        delegateEvents: function() {
            view.View.prototype.delegateEvents.apply(this, arguments);
            this.input().on(this.delegateEventName('focus'), _.bind(this.onFocus, this));
            this.input().on(this.delegateEventName('blur'), _.bind(this.onBlur, this));
            this.input().on(this.delegateEventName('keyup'), _.bind(this.onKeyUp, this));
        },

        undelegateEvents: function() {
            this.input().off(this.delegateEventName(''));
            view.View.prototype.undelegateEvents.apply(this, arguments);
        },

        input: function() {
            return this.inputView.$(this.inputSelector);
        },

        getThrottle: function() {
            return this.throttle;
        },

        setThrottle: function(throttle) {
            this.throttle = throttle;
        },

        getInputValue: function() {
            return this.input().val();
        },

        setInputValue: function(value, triggerEvent) {
            this.input.val(value);
            if(triggerEvent) {
                this._lastInputValue = value;
                this.triggerEvent(event_types.EventType.CHANGE, {
                    value: value
                });
            }
        },

        onFocus: function(e) {
            this.startTimer();
        },

        onBlur: function(e) {
            this.stopTimer();
        },

        onKeyUp: function(e) {
            switch(e.keyCode) {
                case kc.KeyCodes.TAB:
                    e.preventDefault();
                    e.stopPropagation();
                    break;
                case kc.KeyCodes.ENTER:
                    e.preventDefault();
                    e.stopPropagation();
                    break;
                case kc.KeyCodes.UP:
                    break;
                case kc.KeyCodes.DOWN:
                    break;
                default:
                    if(!this.updateDuringType) {
                        this.restartTimer();
                    }
                    break;
            }
        },

        onTimer: function() {
            this._update();
        },

        _update: function() {
            var value = this.getInputValue();
            if(value !== this._lastInputValue) {
                setInputValue(value, true);
            }
        },

        _startTimer: function() {
            if(!this._timer) {
                this._timer = interval(_.bind(this.onTimer, this), this.throttle);
            }
        },

        _stopTimer: function() {
            if(this._timer) {
                clearInterval(this._timer);
                this._timer = null;
            }
        },

        _restartTimer: function() {
            this._stopTimer();
            this._startTimer();
        }
    });

    return {
        InputHandlerView: InputHandlerView
    };

});
