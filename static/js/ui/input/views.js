define(/** @exports ui/input/views */[
    'jquery',
    'underscore',
    'backbone',
    'core/view',
    'events/keycodes',
    'events/type'
], function(
    $,
    _,
    Backbone,
    view,
    kc,
    events_type) {

    var InputHandlerView = view.View.extend(
    /** @lends module:ui/input/views~InputHandlerView.prototype */ {
        
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

            this.throttle = options.throttle;
            this.model = options.model;
            this.modelAttribute = options.modelAttribute;
            this.updateDuringTyping = options.updateDuringTyping;
            this._lastInputValue = '';
            this._timer = null;

            this.setModel(options.model, options.modelAttribute);
            this.setInput(options.inputView, options.inputSelector);
        },


        delegateEventName: function(eventName) {
            //use delegate events so they're removed on destroy()
            return eventName + '.delegateGlobalEvents' + this.cid;
        },

        delegateInputEvents: function() {
            var input = this.getInput();
            if(input) {
                input.on(this.delegateEventName('focus'), _.bind(this.onFocus, this));
                input.on(this.delegateEventName('blur'), _.bind(this.onBlur, this));
                input.on(this.delegateEventName('keypress'), _.bind(this.onKeyPress, this));
            }
        },

        undelegateInputEvents: function() {
            var input = this.getInput();
            if(input) {
                input.off(this.delegateEventName(''));
            }
        },

        delegateEvents: function() {
            view.View.prototype.delegateEvents.apply(this, arguments);
            this.delegateInputEvents();
        },

        undelegateEvents: function() {
            this.undelegateInputEvents();
            view.View.prototype.undelegateEvents.apply(this, arguments);
        },

        getThrottle: function() {
            return this.throttle;
        },

        setThrottle: function(throttle) {
            this.throttle = throttle;
        },

        getModel: function() {
            return this.model;
        },

        setModel: function(model, attribute) {
            if(!model) {
                model = new Backbone.Model({value: ''});
                attribute = 'value';
            }

            if(this.model) {
                this.stopListening(this.model);
            }
            
            this.model = model;
            this.modelAttribute = attribute;
            this.listenTo(this.model, 'change:' + attribute, this.onModelChange);
        },

        getInput: function() {
            var result;
            if(this.inputView) {
                result = this.inputView.$(this.inputSelector);
            }
            return result;
        },

        setInput: function(inputView, inputSelector) {
            if(this.inputView) {
                this.undelegateInputEvents();
            }
            
            if(inputView) {
                this.inputView = inputView;
                this.inputSelector = inputSelector;
                this.delegateInputEvents();
            }
        },

        getInputValue: function() {
            return this.model.get(this.modelAttribute);
        },

        setInputValue: function(value, triggerEvent) {
            this.model.set(this.modelAttribute, value);
            if(triggerEvent) {
                this._lastInputValue = value;
                this.triggerEvent(events_type.EventType.CHANGE, {
                    value: value
                });
            }
        },

        classes: function() {
            return ['input-handler'];
        },

        render: function() {
            this.$el.html();
            this.$el.attr('class', this.classes().join(' '));
            return this;
        },

        onModelChange: function() {
            this.getInput().val(this.getInputValue());
        },

        onFocus: function(e) {
            this._startTimer();
        },

        onBlur: function(e) {
            this._stopTimer();
            this._update();
        },

        onKeyPress: function(e) {
            switch(e.keyCode) {
                case kc.KeyCodes.ENTER:
                    this._update();
                    e.preventDefault();
                    e.stopPropagation();
                    break;
                default:
                    if(!this.updateDuringType) {
                        this._restartTimer();
                    }
                    break;
            }
        },

        onTimer: function() {
            this._update();
        },

        _update: function() {
            var value = this.getInput().val();
            if(value !== this._lastInputValue) {
                this.setInputValue(value, true);
            }
        },

        _startTimer: function() {
            if(!this._timer) {
                this._timer = setInterval(_.bind(this.onTimer, this), this.throttle);
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
