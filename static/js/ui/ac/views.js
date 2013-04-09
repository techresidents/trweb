define(/** @exports ui/ac/ac */[
    'jquery',
    'underscore',
    'backbone',
    'core/factory',
    'core/view',
    'events/keycodes',
    'events/type',
    'ui/ac/inputhandler',
    'ui/collection/views',
    'ui/drop/views',
    'ui/select/models',
    'ui/select/views',
    'ui/template/views',
    'text!ui/ac/templates/multi_autocomplete.html',
    'text!ui/ac/templates/multi_autocomplete_item.html'
], function(
    $,
    _,
    Backbone,
    factory,
    view,
    kc,
    events_type,
    ac_inputhandler,
    collection_views,
    drop_views,
    select_models,
    select_views,
    template_views,
    multi_autocomplete_template,
    multi_autocomplete_item_template) {

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
                dropTargetView: options.inputView,
                dropTargetSelector: options.inputSelector,
                selectView: defaultSelectViewFactory,
                inputHandlerView: defaultInputHandlerViewFactory,
                stringify: options.matcher.stringify,
                throttle: 250,
                preventDefaultOnEnter: true
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
            this.inputHandlerView.setInputValue('');
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
                this.inputHandlerView.setInputValue(value);
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
            setTimeout(_.bind(this.close, this), 100);
        },

        isOpen: function() {
            return this.dropView.isOpen();
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
                    value: this.stringify(match)
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
                this.inputHandlerView.setInputValue(value);
                this.close();
                this.setLastSelectedMatch(this._valueToMatch(value), true);
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

            template_views.TemplateView.prototype.initialize.call(this, options);
        }
    });

    MultiAutoCompleteItemView.Factory = factory.buildFactory(
            MultiAutoCompleteItemView);

    var MultiAutoCompleteView = view.View.extend({

        defaultTemplate: multi_autocomplete_template,

        inputSelector: '.input-container input',

        events: {
            'click .outer-container': 'onOuterClick',
            'select .autocomplete': 'onSelect',
            'click .close': 'onClose',
            'keypress .input-container input': 'onInputKeypress',
            'focus .input-container input': 'onInputFocus',
            'blur .input-container input': 'onInputBlur'
        },

        initialize: function(options) {
            options = _.extend({
                template: this.defaultTemplate,
                stringify: options.matcher.stringify
            }, options);
            
            this.template = _.template(options.template);
            this.collection = options.collection;
            this.matcher = options.matcher;
            this.stringify = options.stringify;
            this.placeholder = options.placeholder;
            this.viewFactory = options.viewFactory || 
                new MultiAutoCompleteItemView.Factory({
                    stringify: options.stringify
                });

            //bind events
            this.listenTo(this.collection, 'reset add remove', this.onCollectionChange);
            
            //child views
            this.autocompleteView = null;
            this.listView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.autocompleteView = new AutoCompleteView({
                inputView: this,
                inputSelector: this.inputSelector,
                dropTargetView: this,
                dropTargetSelector: '.outer-container',
                matcher: this.matcher,
                stringify: this.stringify,
                forceSelection: true
            });
            
            this.listView = new collection_views.ListView({
                collection: this.collection,
                viewFactory: this.viewFactory
            });
        },

        childViews: function() {
            return [this.listView, this.autocompleteView];
        },

        classes: function() {
            return ['multi-autocomplete'];
        },

        render: function() {
            this.$el.html(this.template());
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.autocompleteView);
            this.append(this.listView, '.list-container');
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

        onCollectionChange: function() {
            this.applyPlaceholder();
        },

        onOuterClick: function(e) {
            this.autocompleteView.focus();
        },

        onSelect: function(e, eventBody) {
            var model = eventBody.match;
            this.collection.add(model);
            this.autocompleteView.clear();
            this.autocompleteView.clearLastMatch();
            this.autocompleteView.focus();
        },

        onInputKeypress: function(e) {
            switch(e.keyCode) {
                case kc.KeyCodes.BACKSPACE:
                    if(!this.$(this.inputSelector).val() &&
                       this.collection.length) {
                        this.collection.pop();
                    }
                    break;
            }
        },

        onClose: function(e) {
            var id = this.listView.eventToId(e);
            var model = this.collection.get(id);
            if(model) {
                this.collection.remove(model);
            }
            this.autocompleteView.focus();
        },

        onInputFocus: function(e) {
            this.$el.addClass('focus');
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
