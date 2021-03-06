define(/** @exports ui/input/views */[
    'jquery',
    'underscore',
    'backbone',
    'core',
    '../events/type',
    '../events/keycodes'
], function(
    $,
    _,
    Backbone,
    core,
    events,
    kc) {
    
    var EventType = {
        CHANGE: events.CHANGE,
        ENTER_KEY: 'enterkey'
    };

    var InputHandlerView = core.view.View.extend(
    /** @lends module:ui/input/views~InputHandlerView.prototype */ {

        /**
         * InputHandlerView constructor
         * @constructor
         * @augments module:core/view~View
         * @param {object} options Options object
         * @param {View} options.inputView view with an input field
         * @param {string} options.inputSelector String to select
         *    the input element of options.inputView
         * @param {number} [options.throttle=150] number of millisecs to throttle
         *    before events are triggered
         * @param {object} [options.model] model to update after change event
         * @param {string} [options.modelAttribute] model attribute to update
         *    after change event.
         * @param {boolean} [options.trim=true] If true, will trim whitespace
         * @param {boolean} [options.updateDuringTyping=false] if true, will
         *    will not wait for user to stop typing before triggering a change
         *    event.
         * @param {boolean} [options.preventDefaultOnEnter=true] If true, will
         *    prevent the enter key push event from propagating
         * @param {boolean} [options.blurOnEnter=true] If true, will trigger
         *    a blur event when enter key is pushed. Requires
         *    options.preventDefaultOnEnter to be true.
         * @classdesc
         * Handler for a view with an input field. This view has no associated
         * template or UI.
         */
        events: {
        },

        initialize: function(options) {
            options = _.extend({
                throttle: 150,
                trim: true,
                updateDuringTyping: false,
                preventDefaultOnEnter: true,
                blurOnEnter: true
            }, options);

            this.throttle = options.throttle;
            this.model = options.model;
            this.modelAttribute = options.modelAttribute;
            this.trim = options.trim;
            this.updateDuringTyping = options.updateDuringTyping;
            this.preventDefaultOnEnter = options.preventDefaultOnEnter;
            this.blurOnEnter = options.blurOnEnter;
            this._lastInputValue = '';
            this._timer = null;
            this._hasFocusPerEvent = false;

            this.setModel(options.model, options.modelAttribute);
            this.setInput(options.inputView, options.inputSelector);
        },

        delegateInputEvents: function() {
            if(this.inputView) {
                this.undelegateInputEvents();
                this.inputView.addEventListener(this.cid, 'focus', this.onFocus, this, this.inputSelector);
                this.inputView.addEventListener(this.cid, 'blur', this.onBlur, this, this.inputSelector);
                this.inputView.addEventListener(this.cid, 'keydown', this.onKeyDown, this, this.inputSelector);
            }
        },

        undelegateInputEvents: function() {
            if(this.inputView) {
                this.inputView.removeEventListeners(this.cid);
            }
        },

        delegateEvents: function() {
            core.view.View.prototype.delegateEvents.apply(this, arguments);
            this.delegateInputEvents();
        },

        undelegateEvents: function() {
            this.undelegateInputEvents();
            core.view.View.prototype.undelegateEvents.apply(this, arguments);
        },

        getThrottle: function() {
            return this.throttle;
        },

        setThrottle: function(throttle) {
            this.throttle = throttle;
        },

        getPreventDefaultOnEnter: function() {
            return this.preventDefaultOnEnter;
        },

        setPreventDefaultOnEnter: function(value) {
            this.preventDefaultOnEnter = value;
            return this;
        },

        getBlurOnEnter: function() {
            return this.blurOnEnter;
        },

        setBlurOnEnter: function(value) {
            this.blurOnEnter = value;
            return this;
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
            if(this.trim) {
                value = core.string.trim(value);
            }

            this._lastInputValue = value;
            this.model.set(this.modelAttribute, value);

            if(triggerEvent) {
                this.triggerEvent(events.CHANGE, {
                    value: value
                });
            }
        },

        getCursorPosition: function() {
            var result;
            var input = this.getInput().get(0);
            if(input.selectionStart !== undefined) {
                result = input.selectionStart;
            } else if(document.selection) {
                this.focus();
                var selection = document.selection.createRange();
                selection.moveStart('character', -input.value.length);
                result = selection.text.length;
            }
            return result;
        },

        setCursorPosition: function(pos) {
            var input = this.getInput().get(0);
            if(input.setSelectionRange) {
                input.setSelectionRange(pos, pos);
            } else if(input.createTextRange) {
                var range = input.createTextRange();
                range.collapse(true);
                range.moveEnd('character', pos);
                range.moveStart('character', pos);
                range.select();
            }
        },

        setCursorStart: function() {
            this.setCursorPosition(0);
        },

        setCursorEnd: function() {
            var value = this.getInput().val();
            this.setCursorPosition(value.length);
        },

        hasFocus: function(options) {
            options = _.extend({
                perEvent: false
            }, options);

            var result = this._hasFocusPerEvent;
            
            if(!options.perEvent) {
                result = this.getInput().is(':focus');
            }
            return result;
        },

        focus: function() {
            this.getInput().focus();
        },

        blur: function() {
            this.getInput().blur();
        },

        classes: function() {
            return ['input-handler'];
        },

        render: function() {
            var modelValue = this.getInputValue();
            this.$el.empty();
            this.$el.attr('class', this.classes().join(' '));
            this.getInput().val(modelValue);
            return this;
        },

        onModelChange: function() {
            var modelValue = this.getInputValue();
            var inputValue = this.getInput().val();
            if(!this.trim || !inputValue ||
               modelValue !== core.string.trim(inputValue)) {
                this.getInput().val(modelValue);
            }
        },

        onFocus: function(e) {
            this._hasFocusPerEvent = true;
            this._startTimer();
        },

        onBlur: function(e) {
            this._hasFocusPerEvent = false;
            this._stopTimer();
            this._update();
        },

        onKeyDown: function(e) {
            switch(e.keyCode) {
                case kc.ENTER:
                    this._update();
                    if(this.preventDefaultOnEnter) {
                        e.preventDefault();
                        e.stopPropagation();

                        if(this.blurOnEnter) {
                            this.getInput().blur();
                        }

                        this.triggerEvent(EventType.ENTER_KEY, {
                            value: this.getInputValue()
                        });
                    }
                    break;
                default:
                    if(!this.updateDuringTyping) {
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
            if(this.trim) {
                value = core.string.trim(value);
            }
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
        EventType: EventType,
        InputHandlerView: InputHandlerView
    };

});
