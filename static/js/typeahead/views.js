define([
    'jQuery',
    'Underscore',
    'Backbone',
    'lookup/models',
], function($, _, Backbone, models) {
    
    /*
     * Typeahead view.
     * This view provides a wrapper around the modified bootstrap typeahead
     * jquery plugin allowing for additional  options and  making 
     * stronger guarantees about the onselect/oneneter callbacks being called.
     * @constructor
     * @param {options} - options object
     *   source: requuired boostrap typeahead plugin source array
     *   maxResults: max number of typeahead results to return (default 8)
     *   forceSelection: boolean indicating if the user should be forced
     *     to select an autocompleted result. (default false)
     *   onenter: optional callback to be invoked when the user presses
     *     enter in the typeahead input when typeahead menu is not visible.
     *     If provided, method will be invoked with (value) args where
     *     value is the string in the typeahead input.
     *     If force selection is true onenter will only be invoked
     *     if the value of the typeahead input matches an autocomplete
     *     option.
     *   onselect: optional callback to be invoked when a typeahead 
     *     result is selected either explicity through the typeahead
     *     menu or implicitly when focus is lost. If provided, the
     *     callback will be invoked with (value) arguments  where
     *     value is the string in the typeahead input.     
     *     If forceSelection is true, object is guaranteed to only be
     *     call if the value if in the typeahead input matches an
     *     autocomplete option.
     */

    var TypeaheadView = Backbone.View.extend({

            events: {
                "keypress": "keypress",
                "blur": "blur",
            },

            initialize: function(options) {
                this.source = options.source;
                this.maxResults = options.maxResults || 8;
                this.forceSelection = options.forceSelection || false;
                this.onenter = options.onenter;
                this.onselect = options.onselect;
                this.lastSelection = null;
                
                //create bootstrap typeahead
                var that = this;
                this.el.typeahead({
                    source: this.source,
                    items: this.maxResults,
                    onselect: function(value) {
                        that.selected.call(that, value);
                    },
                });
                
                //store the actual typeahead plugin so we can make
                //some strong guarantees about onselect.
                this.typeahead = this.el.data("typeahead");
            },

            /**
             * Clear the typeahead input.
             */
            clear: function() {
                this.el.val(null);
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
                    this.onselect(value);
                }
            },
            
            /**
             * keypress event handler.
             * @param {e} event object.
             */
            keypress: function(e) {
                //if enter is pressed and the typeahead menu is not visible, process.
                if(e.keyCode == 13 && !this.typeahead.shown) {
                    value = this.el.val();

                    if(value && this.onenter) {
                        //only invoke onenter callback if forceSelection is false
                        //or typeahead value matches an autocomplete option.
                        if(!this.forceSelection || this.lastSelected == value) {
                            this.onenter(value);
                        }
                    }
                }
            },
            
            /**
             * blue event handler.
             * @param {e} event object.
             */
            blur: function(e) {
                value = this.el.val();
                
                //Handle the case where the user has typed text into the typeahead
                //input and then clicked another elment on the page. In this situation
                //the jquery plugin will not have given us a selected event, so
                //we need to directly access the plugin object and determine
                //if the text value in the input is a match and trigger the
                //selected event manually.
                
                //see if the input value matches one of the autocomplete options.
                //if it does trigger the selected event, otherwise only trigger
                //the selected event if this.forceSelection is false, since
                //we guarantee that this will not happen when this.forceSelection
                //is true.
                if(this.lastSelected != value) {
                    match = _.find(this.source, function(source) { return source == value; });
                    if(match || !this.forceSelection) {
                        this.selected(value);
                    }
                }
                
                //Null out the typeahead input if forceSelection si true and the
                //value in the input does not macch an autocomplete option.
                if(this.forceSelection) {
                    if(this.lastSelected.value != value) {
                        this.el.val(null);
                    }
                }
            }
    });

    return {
        TypeaheadView: TypeaheadView,
    }
});
