define([
    'jQuery',
    'Underscore',
    'Backbone',
], function($, _, Backbone) {
    
    /*
     * Typeahead view.
     * This view provides a wrapper around the modified bootstrap typeahead
     * jquery plugin allowing for additional  options and  making 
     * stronger guarantees about the onselect/oneneter callbacks being called.
     * @constructor
     * @param {options} - options object
     *   source: boostrap typeahead plugin source array (strings or objects).
     *     If not provided, the element data-source attribute will be used.
     *   property: if sources contains objects, the object property to display
     *   maxResults: max number of typeahead results to return (default 8)
     *   forceSelection: boolean indicating if the user should be forced
     *     to select an autocompleted result. (default false)
     *   onenter: optional callback to be invoked when the user presses
     *     enter in the typeahead input when typeahead menu is not visible.
     *     If provided, method will be invoked with (value) args, or
     *     (value, object) args if property is set, where value is 
     *     the string in the typeahead input and object is the 
     *     source object.
     *     If force selection is true onenter will only be invoked
     *     if the value of the typeahead input matches an autocomplete
     *     option.
     *   onselect: optional callback to be invoked when a typeahead 
     *     result is selected either explicity through the typeahead
     *     menu or implicitly when focus is lost.
     *     If provided, method will be invoked with (value) args, or
     *     (value, object) args if property is set, where value is 
     *     the string in the typeahead input and object is the 
     *     source object.
     *     If forceSelection is true, onselect is guaranteed to only be
     *     called if the value if in the typeahead input matches an
     *     autocomplete option.
     *  context: optional callback context (default TypeaheadView object).
     */

    var TypeaheadView = Backbone.View.extend({

        events: {
            'keypress': 'keypress',
            'blur': 'blur',
        },

        initialize: function(options) {
            this.source = options.source || this.$el.data('source');
            this.property = options.property;
            this.maxResults = options.maxResults || 8;
            this.forceSelection = options.forceSelection || false;
            this.onenter = options.onenter;
            this.onselect = options.onselect;
            this.context = options.context || this;
            this.lastSelection = null;
            this.lastValue = null;
            
            //create bootstrap typeahead
            var that = this;
            this.$el.typeahead({
                source: this.source,
                property: this.property,
                items: this.maxResults,
                onselect: function(value) {
                    that.selected.call(that, value);
                },
            });
            
            //store the actual typeahead plugin so we can make
            //some strong guarantees about onselect.
            this.typeahead = this.$el.data('typeahead');
        },

        /**
         * Clear the typeahead input.
         */
        clear: function() {
            this.$el.val(null);
        },
        
        /**
         * Helper function which returns true if value matches lastSelected, false otherwise.
         */
        matchesLastSelected: function(value) {
            if(value && this.lastSelected) {
                if(this.property) {
                    return this.lastSelected[this.property] == value;
                } else {
                    return this.lastSelected == value;
                }
            } else {
                return false;
            }
        },
        
        /**
         * Typeahead selection processing.
         * @param {value} value in typeahead input
         * @param {object} associated LookupResult.matches() object
         *   if value is an autocompleted string. This is guaranteed
         *   to not be null if forceSelection is true.
         */
        selected: function(value) {

            this.lastSelected = value;
            if(this.onselect) {
                if(this.property && value[this.property]) {
                    this.onselect.call(this.context, value[this.property], value);
                } else if(this.property) {
                    //non-autocomoplete option selected (forceSelection is false)
                    this.onselect.call(this.context, value, null);
                } else {
                    this.onselect.call(this.context, value);
                }
            }
        },
        
        /**
         * keypress event handler.
         * @param {e} event object.
         */
        keypress: function(e) {
            this.lastValue = this.$el.val();

            //if enter is pressed and the typeahead menu is not visible, process.
            if(e.keyCode == 13 && !this.typeahead.shown) {
                value = this.$el.val();
                
                if(value && this.onenter) {
                    //only invoke onenter callback if forceSelection is false
                    //or typeahead value matches an autocomplete option.
                    var object = null;
                    var matches = false;
                    if(this.matchesLastSelected(value)) {
                        matches = true;
                        object = this.lastSelected;
                    }
                    if(matches || !this.forceSelection) {
                        if(this.property) {
                            this.onenter.call(this.context, value, object);
                        } else {
                            this.onenter.call(this.context, value);
                        }
                    }
                }
            }
        },
        
        /**
         * blue event handler.
         * @param {e} event object.
         */
        blur: function(e) {
            value = this.$el.val();
            
            //Handle the case where the user has typed text into the typeahead
            //input and then clicked another elment on the page. In this situation
            //the jquery plugin will not have given us a selected event, so
            //we need to directly access the plugin object and determine
            //if the text value in the input is a match and trigger the
            //selected event manually.
            
            //see if the input value matches one of the autocomplete options.
            //if it does trigger the selected event.
            if(!this.matchesLastSelected(value)) {
                var that = this;
                match = _.find(this.source, function(source) {
                    if(that.property) {
                        return source[that.property] == value;
                    } else {
                        return source == value;
                    }
                });
                if(match) {
                    this.selected(match);
                }
            }
            
            //Null out the typeahead input if forceSelection is true and the
            //value in the input does not match an autocomplete option.
            if(this.forceSelection) {
                if(!this.matchesLastSelected(value)) {
                    this.$el.val(null);
                }
            }
        }
    });

    return {
        TypeaheadView: TypeaheadView,
    }
});
