define(/** @exports ui/ac/inputhandler */[
    'jquery',
    'underscore',
    'core/view',
    'events/type',
    'events/keycodes',
    'ui/input/views'
], function(
    $,
    _,
    view,
    events_type,
    kc,
    input_views) {

    var EventType = {
        CHANGE: events_type.EventType.CHANGE,
        ENTER_KEY: 'enterkey'
    };

    var ACInputHandlerView = input_views.InputHandlerView.extend(
    /** @lends module:ui/ac/inputhandler~ACInputHandlerView.prototype */ {
        
        /**
         * ACInputHandlerView constructor
         * @constructs
         * @augments module:ui/input/views~InputHandlerView
         * @param {object} options Options object
         */
        initialize: function(options) {
            this.autocomplete = options.autocomplete;
            input_views.InputHandlerView.prototype.initialize.call(this, options);
        },

        getAutoComplete: function() {
            return this.autocomplete;
        },

        setAutoComplete: function(autocomplete) {
            this.autocomplete = autocomplete;
            return this;
        },

        onBlur: function(e) {
            input_views.InputHandlerView.prototype.onBlur.call(this, e);
            this.autocomplete.selectInput();
        },

        onKeyPress: function(e) {
            switch(e.keyCode) {
                case kc.KeyCodes.ESC:
                    if(this.autocomplete.isOpen()) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.autocomplete.close();
                    }
                    break;
                case kc.KeyCodes.TAB:
                    this._update();
                    if(this.autocomplete.isOpen()) {
                        if(this.autocomplete.selectHighlighted()) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    }
                    break;
                case kc.KeyCodes.ENTER:
                    this._update();
                    if(this.autocomplete.isOpen()) {
                        if(this.autocomplete.selectHighlighted()) {
                            e.preventDefault();
                            e.stopPropagation();
                            return true;
                        }
                    }

                    this.autocomplete.selectInput();

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
                case kc.KeyCodes.UP:
                    if(this.autocomplete.isOpen()) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.autocomplete.highlightPrevious();
                    }
                    break;
                case kc.KeyCodes.DOWN:
                    if(this.autocomplete.isOpen()) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.autocomplete.highlightNext();
                    }
                    break;
                default:
                    if(!this.updateDuringType) {
                        this._restartTimer();
                    }
                    break;
            }
        }
    });

    return {
        EventType: EventType,
        ACInputHandlerView: ACInputHandlerView
    };

});
