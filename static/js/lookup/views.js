define([
    'jQuery',
    'Underscore',
    'Backbone',
    'lookup/models',
], function($, _, Backbone, models) {
    
    /*
     * Autocomplete lookup view.
     * This view provides a wrapper around a modified bootstrap typeahead
     * jquery plugin allowing for the lookup results to be populated
     * by ajax queries to the lookupsvc. Additionally, this view provides
     * additional  options and makes stronger guarantees about the onselect
     * callback being called.
     * @constructor
     * @param {options} - options object
     *   scope: required lookupsvc scope, i.e. "location", "technology"
     *   category: optional lookupsvc category, i.e. "zipcode", "city"
     *   maxResults: max number of typeahead results to return (default 8)
     *   cacheSize: max number of lookupsvc results to cache (default 30)
     *   forceSelection: boolean indicating if the user should be forced
     *     to select an autocompleted result. (default false)
     *   onenter: optional callback to be invoked when the user presses
     *     enter in the typeahead input when typeahead menu is not visible.
     *     If provided, method will be invoked with (value, object) where
     *     value is the string in the typeahead input and object is the
     *     LookupResult.matches object which is scope/category specific.
     *   onselect: optional callback to be invoked when a typeahead 
     *     result is selected either explicity through the typeahead
     *     menu or implicitly when focus is lost. If provided, the
     *     callback will be invoked with (value, object) where
     *     value is the string in the typeahead input and object is the
     *     LookupResult.matches object which is scope/category specific.
     *     If forceSelection is true, object is guaranteed to not be null,
     *     otherwise object will be null if the user has entered text
     *     which was not autocompleted.
     */
    var LookupView = Backbone.View.extend({

            events: {
                "keypress": "keypress",
                "blur": "blur",
            },

            initialize: function(options) {
                this.scope = options.scope || "";
                this.category = options.category;
                this.maxResults = options.maxResults || 8;
                this.cacheSize = options.cacheSize || 30;
                this.forceSelection = options.forceSelection || false;
                this.onenter = options.onenter;
                this.onselect = options.onselect;
                this.lastSelected = null;
                
                //create bootstrap typeahead
                var that = this;
                this.el.typeahead({
                    source: function(typeahead, query) {
                        that.lookup.call(that, typeahead, query);
                    },
                    onselect: function(object) {
                        that.selected.call(that, object.value, object);
                    },
                    //display LookupResult.matches() "value" property in typeahead menu.
                    property: "value",
                });
                
                //store the actual typeahead plugin so we can make
                //some strong guarantees about onselect.
                this.typeahead = this.el.data("typeahead");
                
                this.lookupCache = new models.LookupCache(null, {
                    scope: this.scope,
                    category: this.category,
                    maxResults: this.maxResults,
                    cacheSize: this.cacheSize 
                });
            },

            /**
             * Clear the typeahead input.
             */
            clear: function() {
                this.lastSelected = null;
                this.el.val(null);
            },
            
            /**
             * Proxy bootstrap typeahead queries to lookupsvc.
             * @param {typeahead} bootstrap jquery typeahead plugin
             * @param {query} query string
             */
            lookup: function(typeahead, query) {
                var that = this;
                this.lookupCache.lookup(
                        query, 
                        function(query, result) {
                            that.lookupCompleted.call(that, typeahead, query, result);
                        }
                );
            },

            /**
             * Completed lookup callback.
             * @param {typeahead} bootstrap jquery typeahead plugin.
             * @param {query} query string
             * @param {lookupResult} LookupResult object.
             */
            lookupCompleted: function(typeahead, query, lookupResult) {
                data = lookupResult.matches();
                typeahead.process(data);
            },

            /**
             * Typeahead selection processing.
             * @param {value} value in typeahead input
             * @param {object} associated LookupResult.matches() object
             *   if value is an autocompleted string. This is guaranteed
             *   to not be null if forceSelection is true.
             */
            selected: function(value, object) {
                this.lastSelected = object;
                if(this.onselect) {
                    this.onselect(value, object);
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
                        object = null;
                        if(this.lastSelected && this.lastSelected.value == value) {
                            object = this.lastSelected;
                        }
                        this.onenter(value, object);
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
                if(!this.lastSelected || this.lastSelected.value != value) {
                    //get the result from the lookup cache.
                    //this is guaranteed to be a cache hit, so we
                    //can count on a return value.
                    result = this.lookupCache.lookup(value);

                    if(result) {
                        //see if the input value matches one of the autocomplete options.
                        //if it does trigger the selected event, otherwise only trigger
                        //the selected event if this.forceSelection is false, since
                        //we guarantee that this will not happen when this.forceSelection
                        //is true.
                        match = _.find(result.matches(), function(m) { return m.value == value; });
                        if(match) {
                            this.selected(match.value, match);
                        } else if(!this.forceSelection) {
                            this.selected(value, null);
                        }
                    }
                }
                
                //Null out the typeahead input if forceSelection si true and the
                //value in the input does not macch an autocomplete option.
                if(this.forceSelection) {
                    if(!this.lastSelected || this.lastSelected.value != value) {
                        this.el.val(null);
                    }
                }
            }
    });

    return {
        LookupView: LookupView,
    }
});
