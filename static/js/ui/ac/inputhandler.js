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

        onKeyPress: function(e) {
            switch(e.keyCode) {
                case kc.KeyCodes.ESC:
                    if(this.autocomplete.isOpen()) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.autocomplete.close();
                    }
                    break;
                case kc.KeyCodes.ENTER:
                    if(this.autocomplete.isOpen()) {
                        if(this.autocomplete.selectHighlighted()) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
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
        ACInputHandlerView: ACInputHandlerView
    };

});
