define(/** @exports ui/ac/ac */[
    'jquery',
    'underscore',
    'backbone',
    'core/factory',
    'core/string',
    'core/view',
    'ui/ac/inputhandler',
    'ui/drop/views',
    'ui/select/models',
    'ui/select/views'
], function(
    $,
    _,
    Backbone,
    factory,
    core_string,
    view,
    ac_inputhandler,
    drop_views,
    select_models,
    select_views) {
    
    var defaultInputHandlerViewFactory = new factory.Factory(
            ac_inputhandler.ACInputHandlerView,
            {});

    var defaultSelectViewFactory = new factory.Factory(
            select_views.SelectView,
            {});
    
    var AutoCompleteView = view.View.extend(
    /** @lends module:ui/ac/ac~AutoCompleteView.prototype */ {
        
        /**
         * AutoCompleteView constructor
         * @constructor
         * @augments module:core/view~View
         * @param {object} options Options object
         */
        initialize: function(options) {
            options = _.extend({
                maxResults: 8,
                inputHandlerView: defaultInputHandlerViewFactory,
                selectView: defaultSelectViewFactory,
                stringify: core_string.stringify
            }, options);

            this.matcher = options.matcher;
            this.maxResults = options.maxResults;
            this.inputView = options.inputView;
            this.inputSelector = options.inputSelector;
            this.stringify = options.stringify;
            this.inputModel = new Backbone.Model({search: ''});
            this.selectionCollection = new select_models.SelectionCollection();

            //child views
            this.dropView = null;
            this.inputHandlerView = options.inputHandlerView;
            this.selectView = options.selectView;
            this.initChildViews();

            //bind events
            this.listenTo(this.inputModel, 'change:search', this.onInputChange);
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
            this.inputHandlerView.setModel(this.inputModel, 'search');

            //select view
            if(this.selectView instanceof factory.Factory) {
                this.selectView = this.selectView.create();
            } 
            this.selectView.setCollection(this.selectionCollection);

            //drop view
            this.dropView = new drop_views.DropView({
                view: this.selectView,
                targetView: this.inputView,
                targetSelector: this.inputSelector
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

        selectHighlighted: function() {
            var model = this.selectView.getHighlighted();
            if(model) {
                this.inputHandlerView.setInputValue(model.get('value'));
                this.close();
                return true;
            } 
            return false;
        },

        open: function() {
            this.dropView.open();
        },

        close: function() {
            this.dropView.close();
        },

        isOpen: function() {
            return this.dropView.isOpen;
        },

        isClosed: function() {
            return !this.dropView.isOpen;
        },

        onInputChange: function() {
            var search = this.inputModel.get('search');
            if(search) {
                this.matcher.match(
                        search,
                        this.maxResults,
                        _.bind(this.onMatches, this));
            } else {
                this.close();
            }
        },

        onMatches: function(search, matches) {
            var input = this.inputModel.get('search');
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
            }
        },

        onHighlightedChange: function(model) {
        }
    });

    return {
        AutoCompleteView: AutoCompleteView
    };

});
