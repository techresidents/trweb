define(/** @exports ui/ac/ac */[
    'jquery',
    'underscore',
    'backbone',
    'core',
    '../events/type',
    '../events/keycodes',
    './inputhandler',
    '../collection/views',
    '../drop/views',
    '../select/models',
    '../select/views',
    '../template/views',
    'text!./templates/multi_autocomplete.html',
    'text!./templates/multi_autocomplete_item.html',
    'text!./templates/multi_autocomplete_list.html'
], function(
    $,
    _,
    Backbone,
    core,
    events,
    kc,
    ac_inputhandler,
    collection_views,
    drop_views,
    select_models,
    select_views,
    template_views,
    multi_autocomplete_template,
    multi_autocomplete_item_template,
    multi_autocomplete_list_template) {

    var EventType = {
        SELECT: events.SELECT,
        ENTER_KEY: 'enterkey'
    };
    
    var defaultInputHandlerViewFactory = new core.factory.Factory(
            ac_inputhandler.ACInputHandlerView,
            {});

    var defaultSelectViewFactory = new core.factory.Factory(
            select_views.SelectView,
            {});
    
    var AutoCompleteView = core.view.View.extend(
    /** @lends module:ui/ac/ac~AutoCompleteView.prototype */ {

        events: {
            'select .drop': 'onDropSelect',
            'change .input-handler': 'onInputChange',
            'enterkey .input-handler': 'onInputEnterKey'
        },
        
        /**
         * AutoCompleteView constructor
         * @constructor
         * @augments module:core/view~View
         * @param {object} options Options object
         * @param {View} options.dropTargetView the view where the autocomplete
         *    results (a DropView) will attach
         * @param {string} options.dropTargetSelector selector for the input
         *    options.dropTargetView
         * @param {Matcher} options.matcher Matcher object
         * @param {boolean} [options.forceSelection=true] If true, user must
         *    select one of the autocomplete results
         * @param {number} [options.maxResults=8] Maximum number of autocomplete
         *    results to display
         * @param {number} [options.throttle=250] Number of millisecs to throttle
         *    autocomplete lookups
         * @param {boolean} [options.preventDefaultOnEnter=true] If true, will
         *    prevent the enter key push event from propagating
         */
        initialize: function(options) {
            options = _.extend({
                forceSelection: true,
                maxResults: 8,
                dropTargetView: options.inputView,
                dropTargetSelector: options.inputSelector,
                selectView: defaultSelectViewFactory,
                inputHandlerView: defaultInputHandlerViewFactory,
                stringify: options.matcher.stringify,
                throttle: 250,
                preventDefaultOnEnter: true,
                defaultSearch: null
            }, options);

            this.forceSelection = options.forceSelection;
            this.maxResults = options.maxResults;
            this.inputView = options.inputView;
            this.inputSelector = options.inputSelector;
            this.dropTargetView = options.dropTargetView;
            this.dropTargetSelector = options.dropTargetSelector;
            this.stringify = options.stringify;
            this.throttle = options.throttle;
            this.preventDefaultOnEnter = options.preventDefaultOnEnter;
            this.defaultSearch = options.defaultSearch;
            this.matcher = options.matcher;
            this.selectionCollection = new select_models.SelectionCollection();
            this.lastMatches = null;
            this.lastSelectedMatch = null;
            this.delayedCloseTimer = null;

            //child views
            this.dropView = null;
            this.inputHandlerView = options.inputHandlerView;
            this.selectView = options.selectView;
            this.initChildViews();

            //bind events
            this.listenTo(this.selectionCollection, 'change:selected', this.onSelectedChange);
            this.listenTo(this.selectionCollection, 'change:highlighted', this.onHighlightedChange);
        },

        initChildViews: function() {
            //input handler view
            if(this.inputHandlerView instanceof core.factory.Factory) {
                this.inputHandlerView = this.inputHandlerView.create();
            } 
            this.inputHandlerView.setAutoComplete(this);
            this.inputHandlerView.setInput(this.inputView, this.inputSelector);
            this.inputHandlerView.setThrottle(this.throttle);
            this.inputHandlerView.setPreventDefaultOnEnter(
                    this.preventDefaultOnEnter);

            //select view
            if(this.selectView instanceof core.factory.Factory) {
                this.selectView = this.selectView.create();
            } 
            this.selectView.setCollection(this.selectionCollection);
            
            //drop view
            this.dropView = new drop_views.DropView({
                view: this.selectView,
                targetView: this.dropTargetView,
                targetSelector: this.dropTargetSelector,
                useTargetWidth: true
            });
        },

        childViews: function() {
            return [this.inputHandlerView, this.dropView];
        },

        classes: function() {
            return ['autocomplete'];
        },

        render: function() {
            this.$el.html();
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.inputHandlerView);
            this.append(this.dropView);
            return this;
        },

        clear: function() {
            this.setInputValue('');
        },

        clearLastMatch: function() {
            this.lastSelectedMatch = null;
            this.lastMatches = null;
            this.selectionCollection.reset();
        },

        focus: function() {
            this.inputHandlerView.getInput().focus();
        },

        blur: function() {
            this.inputHandlerView.getInput().blur();
        },

        highlightNext: function() {
            var next, nextIndex;
            var model = this.selectView.getHighlighted();
            if(model) {
                nextIndex = this.selectionCollection.indexOf(model) + 1;
                if(nextIndex < this.selectionCollection.length) {
                    next = this.selectionCollection.at(nextIndex);
                }
            } else {
                if(this.selectionCollection.length) {
                    next = this.selectionCollection.at(0);
                }
            }

            if(next) {
                this.selectView.highlight(next);
            } else {
                this.selectView.unhighlight();
            }
        },

        highlightPrevious: function() {
            var prev, prevIndex;
            var length = this.selectionCollection.length;
            var model = this.selectView.getHighlighted();

            if(model) {
                prevIndex = this.selectionCollection.indexOf(model) - 1;
                if(prevIndex >= 0) {
                    prev = this.selectionCollection.at(prevIndex);
                }
            } else {
                if(this.selectionCollection.length) {
                    prev = this.selectionCollection.at(length - 1);
                }
            }

            if(prev) {
                this.selectView.highlight(prev);
            } else {
                this.selectView.unhighlight();
            }
        },

        selectInput: function() {
            var search = this.getInputValue();
            var searchMatch = this._valueToMatch(search);
    
            if(searchMatch) {
                this.setLastSelectedMatch(searchMatch, true);
            } else {
                if(this.forceSelection) {
                    this.clear();
                }
                this.setLastSelectedMatch(null, true);
            }

            // Delay the close to give drop down view events
            // a chance to process. If we close too early
            // a click on the drop down may be missed.
            this.closeOnDelay();
        },

        selectHighlighted: function() {
            var value;
            var model = this.selectView.getHighlighted();
            if(model) {
                value = model.get('value');
                this.setInputValue(value);
                this.close();
                this.setLastSelectedMatch(this._valueToMatch(value), true);
                return true;
            }

            this.close();
            return false;
        },

        open: function() {
            this.dropView.open();
        },

        close: function() {
            this.dropView.close();
        },

        closeOnDelay: function() {
            this.clearCloseOnDelay();

            this.delayedCloseTimer = setTimeout(_.bind(function() {
                this.close();
                this.delayedCloseTimer = null;
            }, this), 250);
        },

        clearCloseOnDelay: function() {
            if(this.delayedCloseTimer) {
                clearTimeout(this.delayedCloseTimer);
                this.delayedCloseTimer = null;
            }
        },

        isOpen: function() {
            return this.dropView.isOpen();
        },

        getLastSelectedMatch: function() {
            return this.lastSelectedMatch;
        },

        setLastSelectedMatch: function(match, triggerEvent) {
            var value = this._matchToValue(match);

            if(match === this.lastSelectedMatch ||
               this._equalsLastValue(value)) {
                return;
            }

            this.lastSelectedMatch = match;

            if(triggerEvent) {
                this.triggerEvent(events.SELECT, {
                    match: match,
                    value: value
                });
            }
        },

        setMatch: function(match, triggerEvent) {
            var value = this._matchToValue(match);
            this.setInputValue(value);
            this.setLastSelectedMatch(match, triggerEvent);
            this.lastMatches = [match];
        },

        getInputValue: function() {
            return this.inputHandlerView.getInputValue();
        },

        setInputValue: function(value, matchFirst) {
            this.inputHandlerView.setInputValue(value);
            if(matchFirst) {
                this.match(value, this.maxResults,
                        _.bind(this.onMatchFirst, this));
            }
        },

        match: function(search, maxResults, callback) {
            maxResults = maxResults || this.maxResults;
            callback = callback || _.bind(this.onMatches, this);
            this.matcher.match(search, maxResults, callback);
        },

        onMatches: function(search, matches) {
            this.lastMatches = matches;
            var input = this.getInputValue();
            var hasFocus = this.inputHandlerView.hasFocus({
                perEvent: true
            });

            var models = _.map(matches, function(match) {
                return {
                    value: this.stringify(match)
                };
            }, this);
            
            if(hasFocus && models.length) {
                this.open();
                this.selectionCollection.reset(models);
            } else if(hasFocus && _.isString(this.defaultSearch) &&
                      search !== this.defaultSearch) {
                this.match(this.defaultSearch, this.maxResults);
            }else {
                this.close();
            }
        },

        onMatchFirst: function(search, matches) {
            this.lastMatches = matches;
            var input = this.getInputValue();
            var models = _.map(matches, function(match) {
                return {
                    value: this.stringify(match)
                };
            }, this);

            if(search === input && models.length) {
                this.selectionCollection.reset(models);
                this.setLastSelectedMatch(this._valueToMatch(input), true);
            }
        },

        onSelectedChange: function(model) {
            if(model.get('selected')) {
                var value = model.get('value');
                this.setInputValue(value);
                this.close();
                this.setLastSelectedMatch(this._valueToMatch(value), true);
            }
        },

        onHighlightedChange: function(model) {
        },

        onInputChange: function(e, eventBody) {
            var search = this.getInputValue();
            if(search) {
                this.match(search, this.maxResults);
            } else if(_.isString(this.defaultSearch)) {
                this.match(this.defaultSearch, this.maxResults);
            } else if(!search) {
                // Delay the close to give drop down view events
                // a chance to process. If we close too early
                // a click on the drop down may be missed.
                this.closeOnDelay();
            }
        },

        onInputEnterKey: function(e, eventBody) {
            e.stopPropagation();

            var value = eventBody.value;
            if(this._equalsLastValue(value)) {
                this.triggerEvent(EventType.ENTER_KEY, {
                    value: value,
                    match: this.lastSelectedMatch
                });
            } else if(!this.forceSelection) {
                this.triggerEvent(EventType.ENTER_KEY, {
                    value: value,
                    match: null
                });
            } else {
                this.focus();
            }
        },

        onDropSelect: function(e) {
            e.stopPropagation();
        },

        _matchToValue: function(match) {
            var result = null;
            if(match) {
                result = this.stringify(match);
            }
            return result;
        },

        _valueToMatch: function(value) {
            var match = _.find(this.lastMatches, function(match) {
                return this.stringify(match).toLowerCase() === value.toLowerCase();
            }, this);
            return match;
        },

        _equalsLastValue: function(value) {
            var result = false;
            var lastValue = this._matchToValue(this.lastSelectedMatch) || '';
            if(value && lastValue) {
                result = value.toLowerCase() === lastValue.toLowerCase();
            }
            return result;
        }
    });
    
    
    var MultiAutoCompleteItemView = template_views.TemplateView.extend({
        initialize: function(options) {
            this.stringify = options.stringify;
            
            options.template = multi_autocomplete_item_template;
            options.classes = ['multi-autocomplete-item'];
            options.context = function(view) {
                return {
                    value: this.stringify(view.model)
                };
            };

            MultiAutoCompleteItemView.__super__.initialize.call(this, options);
        }
    });

    MultiAutoCompleteItemView.Factory = core.factory.buildFactory(
            MultiAutoCompleteItemView);

    
    var MultiAutoCompleteView = collection_views.CollectionView.extend({

        defaultTemplate: multi_autocomplete_template,

        inputSelector: '.multi-autocomplete-input',

        events: {
            'click': 'onOuterClick',
            'select .autocomplete': 'onSelect',
            'click .close': 'onClose',
            'keypress .multi-autocomplete-input': 'onInputKeypress',
            'focus .multi-autocomplete-input': 'onInputFocus',
            'blur .multi-autocomplete-input': 'onInputBlur'
        },

        /**
         * MultiAutoCompleteView constructor
         * @constructor
         * @augments module:core/view~View
         * @param {object} options Options object
         * @param {Collection} options.collection
         * @param {Matcher} options.matcher Matcher object
         * @param {string} [options.template] name of template to use for this view.
         *    This string value will be passed to _.template() to be compiled for
         *    rendering.
         * @param {string} [options.placeholder] Placeholder string
         * @param {object} [options.viewFactory] view factory to generate search
         *    result item views
         * @classdesc
         * MultiAutoCompleteView is a view that wraps the AutoCompleteView with
         * a customized list of search results.
         */
        initialize: function(options) {
            options = _.extend({
                template: this.defaultTemplate,
                stringify: options.matcher.stringify,
                selector: ':last-child'
            }, options);

            if(!options.viewFactory) {
                options.viewFactory = new MultiAutoCompleteItemView.Factory({
                    stringify: options.stringify
                });
            }

            this.matcher = options.matcher;
            this.stringify = options.stringify;
            this.placeholder = options.placeholder;
            this.maxResults = options.maxResults;
            this.defaultSearch = options.defaultSearch;

            MultiAutoCompleteView.__super__.initialize.call(this, options);
            

            //bind events
            this.listenTo(this.collection, 'reset add remove', this.onCollectionChange);
            
            //child views
            this.autocompleteView = null;
            this.initMultiChildViews();
        },

        initMultiChildViews: function() {
            this.autocompleteView = new AutoCompleteView({
                inputView: this,
                inputSelector: this.inputSelector,
                dropTargetView: this,
                dropTargetSelector: null,
                matcher: this.matcher,
                stringify: this.stringify,
                maxResults: this.maxResults,
                defaultSearch: this.defaultSearch,
                forceSelection: true
            });
        },

        childViews: function() {
            var result = MultiAutoCompleteView.__super__.childViews.call(this);
            result.push(this.autocompleteView);
            return result;
        },

        classes: function() {
            return ['multi-autocomplete'];
        },

        appendChildView: function(view) {
            var model = this.viewModelMap[view.cid];
            if (model) {
                view.$el.data('id', model.id || model.cid);
            }

            //append item views before the input
            this.before(view, '.multi-autocomplete-input-container');
        },

        render: function() {
            MultiAutoCompleteView.__super__.render.call(this);
            this.append(this.autocompleteView);
            this.applyPlaceholder();
            return this;
        },

        applyPlaceholder: function() {
            if(this.placeholder) {
                if(this.collection.length === 0) {
                    this.$(this.inputSelector).attr('placeholder', this.placeholder);
                } else if(this.collection.length === 1) {
                    this.$(this.inputSelector).attr('placeholder', null);
                }
            }
        },

        addMatch: function(match) {
            //if match is already in the collection there's
            //no need to find it
            var model = this.collection.find(function(model) {
                return this.stringify(match) === this.stringify(model);
            }, this);

            //match is not currently in collection
            if(!model) {
                //check to see if model was in the collection. i.e. 
                //it was removed and then re-added.
                model = _.find(this.collection.toDestroy, function(model) {
                    return this.stringify(match) === this.stringify(model);
                }, this);
                
                if(!model) {
                    model = match;
                }
                this.collection.add(model);
            }

            this.autocompleteView.clear();
            this.autocompleteView.clearLastMatch();
            this.autocompleteView.focus();

            return model;
        },

        focus: function() {
            this.autocompleteView.focus();
        },

        blur: function() {
            this.autocompleteView.blur();
        },

        onCollectionChange: function() {
            this.applyPlaceholder();
        },

        onOuterClick: function(e) {
            this.autocompleteView.focus();

            //prevent click from closing autocomplete dropdown
            e.preventDefault();
            e.stopPropagation();
        },

        onSelect: function(e, eventBody) {
            var match = eventBody.match;
            this.addMatch(match);
        },

        onInputKeypress: function(e) {
            switch(e.keyCode) {
                case kc.BACKSPACE:
                    if(!this.$(this.inputSelector).val() &&
                       this.collection.length) {
                        this.collection.pop();

                        //prevent backspace from navigating back in browser
                        e.preventDefault();

                        //reapply focus
                        this.focus();
                    }
                    break;
            }
        },

        onClose: function(e) {
            var id = this.eventToId(e);
            var model = this.collection.get(id);
            if(model) {
                this.collection.remove(model);
            }
            this.autocompleteView.focus();
        },

        onInputFocus: function(e) {
            this.$el.addClass('focus');
            if(_.isString(this.defaultSearch) && !this.collection.length) {
                // give time for input to actually get focus
                // and for click event to propagate past drop view
                setTimeout(_.bind(function() {
                    this.autocompleteView.clearCloseOnDelay();
                    this.autocompleteView.match(this.defaultSearch);
                }, this), 200);
            }
        },

        onInputBlur: function(e) {
            this.$el.removeClass('focus');
        }
    });

    return {
        EventType: EventType,
        AutoCompleteView: AutoCompleteView,
        MultiAutoCompleteView: MultiAutoCompleteView
    };

});
