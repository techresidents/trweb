define(/** @exports ui/ac/ac */[
    'jquery',
    'underscore',
    'backbone',
    'core/factory',
    'core/view',
    'events/type',
    'ui/ac/inputhandler',
    'ui/drop/views',
    'ui/select/models',
    'ui/select/views'
], function(
    $,
    _,
    Backbone,
    factory,
    view,
    events_type,
    ac_inputhandler,
    drop_views,
    select_models,
    select_views) {

    var EventType = {
        SELECT: events_type.EventType.SELECT,
        ENTER_KEY: 'enterkey'
    };
    
    var defaultInputHandlerViewFactory = new factory.Factory(
            ac_inputhandler.ACInputHandlerView,
            {});

    var defaultSelectViewFactory = new factory.Factory(
            select_views.SelectView,
            {});
    
    var AutoCompleteView = view.View.extend(
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
         */
        initialize: function(options) {
            options = _.extend({
                forceSelection: true,
                maxResults: 8,
                selectView: defaultSelectViewFactory,
                inputHandlerView: defaultInputHandlerViewFactory,
                throttle: 250,
                preventDefaultOnEnter: true
            }, options);

            this.forceSelection = options.forceSelection;
            this.maxResults = options.maxResults;
            this.inputView = options.inputView;
            this.inputSelector = options.inputSelector;
            this.throttle = options.throttle;
            this.preventDefaultOnEnter = options.preventDefaultOnEnter;
            this.matcher = options.matcher;
            this.selectionCollection = new select_models.SelectionCollection();
            this.lastMatches = null;
            this.lastSelectedMatch = null;

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
            if(this.inputHandlerView instanceof factory.Factory) {
                this.inputHandlerView = this.inputHandlerView.create();
            } 
            this.inputHandlerView.setAutoComplete(this);
            this.inputHandlerView.setInput(this.inputView, this.inputSelector);
            this.inputHandlerView.setThrottle(this.throttle);
            this.inputHandlerView.setPreventDefaultOnEnter(
                    this.preventDefaultOnEnter);

            //select view
            if(this.selectView instanceof factory.Factory) {
                this.selectView = this.selectView.create();
            } 
            this.selectView.setCollection(this.selectionCollection);

            //drop view
            this.dropView = new drop_views.DropView({
                view: this.selectView,
                targetView: this.inputView,
                targetSelector: this.inputSelector,
                useTargetWidth: true
            });
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
            this.inputHandlerView.setInputValue('');
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
            var search = this.inputHandlerView.getInputValue();
            var searchMatch = this._valueToMatch(search);

            if(searchMatch) {
                this.setLastSelectedMatch(searchMatch, true);
            } else if(this.forceSelection) {
                this.clear();
            }
            this.closeOnDelay();
        },

        selectHighlighted: function() {
            var value;
            var model = this.selectView.getHighlighted();
            if(model) {
                value = model.get('value');
                this.setLastSelectedMatch(this._valueToMatch(value), true);
                this.inputHandlerView.setInputValue(value);
                this.close();
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
            setTimeout(_.bind(this.close, this), 100);
        },

        isOpen: function() {
            return this.dropView.isOpen;
        },

        getLastSelectedMatch: function() {
            return this.lastSelectedMatch;
        },

        setLastSelectedMatch: function(match, triggerEvent) {
            var value = this._matchToValue(match);
            if(this._equalsLastValue(value)) {
                return;
            }

            this.lastSelectedMatch = match;
            if(triggerEvent) {
                this.triggerEvent(events_type.EventType.SELECT, {
                    match: match,
                    value: this._matchToValue(match)
                });
            }
        },

        onMatches: function(search, matches) {
            this.lastMatches = matches;
            var input = this.inputHandlerView.getInputValue();
            var models = _.map(matches, function(match) {
                return {
                    value: this.matcher.stringify(match)
                };
            }, this);

            if(models.length) {
                this.open();
                this.selectionCollection.reset(models);
            } else {
                this.close();
            }
        },

        onSelectedChange: function(model) {
            if(model.get('selected')) {
                var value = model.get('value');
                this.setLastSelectedMatch(this._valueToMatch(value), true);
                this.inputHandlerView.setInputValue(value);
                this.close();
            }
        },

        onHighlightedChange: function(model) {
        },

        onInputChange: function(e, eventBody) {
            var search = this.inputHandlerView.getInputValue();
            if(search) {
                this.matcher.match(
                        search,
                        this.maxResults,
                        _.bind(this.onMatches, this));
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
            var result;
            if(match) {
                result = this.matcher.stringify(match);
            }
            return result;
        },

        _valueToMatch: function(value) {
            var match = _.find(this.lastMatches, function(match) {
                return this.matcher.stringify(match).toLowerCase() === value.toLowerCase();
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

    return {
        EventType: EventType,
        AutoCompleteView: AutoCompleteView
    };

});
