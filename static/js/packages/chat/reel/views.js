define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'events',
    'ui',
    'text!./templates/chat_select.html',
    'text!./templates/add_reel_modal.html',
    'text!./templates/add_reel.html',
    'text!./templates/reel_item.html',
    'text!./templates/reel.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    events,
    ui,
    chat_select_template,
    add_reel_modal_template,
    add_reel_template,
    reel_item_template,
    reel_template) {

    /**
     * AddReelButtonView View
     * @constructor
     * @param {Object} options
     *   collection: {ChatReelCollection} object (required)
     */
    var AddReelButtonView = core.view.View.extend({

        events: {
            //'click .add': 'onAddPlaceholder',
            'click .add': 'onAdd'
        },

        initialize: function(options) {
            this.collection = options.collection;
            this.template =  _.template(add_reel_template);
        },

        render: function() {
            this.$el.html(this.template());
            return this;
        },

        onAdd: function() {
            this.triggerEvent(events.SHOW_CHAT_REEL_SELECTOR, {
                chatReelCollection: this.collection
            });
        },

        onAddPlaceholder: function() {
            console.log('adding chat_reel model');
            var userModel = new api.models.User({id: 'CURRENT'});
            var rank = 0;
            var highestRank = null;
            if (this.collection.length) {
                highestRank = this.collection.at(this.collection.length - 1).get_rank();
                rank = highestRank + 1;
            }
            var chat_id = '1q5h1q8'; // 7
            if (rank === 1) {
                chat_id = '4fti4g'; // 8
            }
            if (rank === 2) {
                chat_id = '13ydj40'; // 9
            }
            var model = new api.models.ChatReel({
                user_id: userModel.id,
                chat_id: chat_id, //TODO placholder
                rank: rank
            });
            model.save();
            this.collection.add(model);
        }
    });

    /**
     * ChatSelectView.
     * This view displays a search input and matched list of user chats.
     * If the user's chat is already in their highlight reel,
     * then that chat is not displayed.
     * @constructor
     * @param {Object} options
     *    chatReelCollection: {ChatReelCollection} object (required)
     */
    var ChatSelectView = core.view.View.extend({

        autoSelectViewSelector: '.autoselectview',

        childViews: function() {
            return [this.autoSelectView];
        },

        initialize: function(options) {
            var that = this;
            this.chatReelCollection = options.chatReelCollection;
            this.userModel = new api.models.User({id: 'CURRENT'});
            this.chatSelectionCollection = new ui.select.models.SelectionCollection();
            this.template = _.template(chat_select_template);

            this.queryFactory = function(options) {
                var chatCollection = that.userModel.get_chats();
                return chatCollection.withRelated('topic').filterBy({
                    'topic__title__istartswith': options.search
                });
            };

            this.stringify = function(model) {
                return model.get_topic().get_title();
            };

            this.resultsMap = function(model) {
                var ret = null;
                if (!that.chatReelCollection.where({chat_id: model.id}).length) {
                    var title = model.get_topic().get_title();
                    var date = that.fmt.date(model.get_start(), 'MM/dd/yy hh:mm tt');
                    var searchResultText = title + ' (' + date + ')';
                    ret = {
                        id: model.id,
                        value: searchResultText
                    };
                }
                return ret;
            };

            // This matcher is used to compare the results of the query with
            // the search string specified by the user.
            this.chatMatcher = new ui.ac.matcher.QueryMatcher({
                queryFactory: new core.factory.FunctionFactory(this.queryFactory),
                stringify: this.stringify,
                map: this.resultsMap
            });

            // init child views
            this.autoSelectView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.autoSelectView = new ui.select.views.AutoMultiSelectView({
                inputPlaceholder: 'Search chat titles',
                collection: this.chatSelectionCollection,
                matcher: this.chatMatcher,
                maxResults: 8
            });
        },

        render: function() {
            this.autoSelectView.refresh();
            var context = {};
            this.$el.html(this.template(context));
            this.append(this.autoSelectView, this.autoSelectViewSelector);
            return this;
        },

        /**
         * _chatQueryFactory
         * This query factory is used to seed autocomplete results.
         * These initial results will then be parsed by the user's search
         * string.
         * @param options
         * @returns {*}
         */
        _chatQueryFactory: function(userId, options) {
            return new api.models.ChatCollection().filterBy({
                'user_id__eq': userId,
                'topic__title__istartswith': options.search
            });
        },

        /**
         * _stringifyChatModel
         * A matcher is used to compare the results of the query with
         * the search string specified by the user. This function
         * is used to convert the chat models returned by the query factory
         * into a searchable string (so that the matching can happen against
         * the user specified string).
         * @param model {Chat} object (required)
         * @returns {String}
         * @private
         */
        _stringifyChatModel: function(model) {
            return model.get_topic().get_title();
        },

        /**
         * _chatMatcherResultsMap
         * Convert *matched* chat models into a simplified object to display
         * in the list of results
         * @param model {Chat} object (required)
         * @returns Object literal {id:<>, value:<>}
         * @private
         */
        _chatMatcherResultsMap: function(model) {
            var ret = null;
            // To prevent using a crazy query, filter the
            // results here again to only return chats
            // that are not already included in the ChatReel
            // collection.
            if (!this.chatReelCollection.where({chat_id: model.id}).length) {
                ret = {
                    id: model.id,
                    value: model.get_topic().get_title()
                };
            }
            return ret;
        }
    });

    /**
     * AddReelModalView View
     * @constructor
     * @param {Object} options
     *  chatReelCollection: {ChatReelCollection} object (required)
     */
    var AddReelModalView = core.view.View.extend({

        events: {
        },

        childViews: function() {
            return [this.chatSelectView];
        },

        initialize: function(options) {
            this.chatReelCollection = options.chatReelCollection;
            this.userModel = new api.models.User({id: 'CURRENT'});
            this.template =  _.template(add_reel_modal_template);

            // child views
            this.chatSelectView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.chatSelectView = new ChatSelectView({
                chatReelCollection: this.chatReelCollection
            });
        },

        render: function() {
            this.$el.html(this.template());
            this.append(this.chatSelectView);
            return this;
        },

        onOk: function() {
            this.chatSelectView.chatSelectionCollection.each(
                this._createChatReel,
                this // context
            );
            return true;
        },

        onCancel: function() {
            return true;
        },

        onClose: function() {
            this.chatSelectView.chatSelectionCollection.reset();
            return true;
        },

        /**
         * Create chat reel
         * @param chatSelectionModel
         * @private
         */
        _createChatReel: function(chatSelectionModel) {
            // Only create chat reel objs for the selected chats
            if (chatSelectionModel.selected()) {
                var that = this;
                var highestRank = null;
                var rank = 0;
                // Find rank of last element in collection. Since this collection
                // is sorted, this element will have the highest rank.
                if (this.chatReelCollection.length) {
                    highestRank = this.chatReelCollection
                        .at(this.chatReelCollection.length - 1)
                        .get_rank();
                    rank = highestRank + 1;
                }
                var chatReel = new api.models.ChatReel({
                    user_id: this.userModel.id,
                    chat_id: chatSelectionModel.id,
                    rank: rank
                });
                this.chatReelCollection.add(chatReel);
                var eventBody = {
                    collection: this.chatReelCollection
                };
                this.triggerEvent(events.UPDATE_CHAT_REEL, eventBody);
            }
        }
    });

    /**
     * HighlightReelItemView View
     * @constructor
     * @param {Object} options
     *   model: {ChatReel} object (required)
     */
    var HighlightReelItemView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.model = options.model;
            this.modelWithRelated = ['chat__topic'];
            this.chatModel = this.model.get_chat();
            this.topicModel = this.model.get_chat().get_topic();
            this.template =  _.template(reel_item_template);

            // set data bindings
            //this.listenTo(this.model, 'change', this.onChange);
            this.listenTo(this.chatModel, 'change:start', this.onChatChange);
            this.listenTo(this.topicModel, 'change:title', this.onTopicChange);

            //load root topic and all sub-topic data
            this.loader = new api.loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated }
            ]);
            this.listenTo(this.loader, 'loaded', this.render);
            this.loader.load(); // invokes 'change' event on this.model when loaded
        },

        onChange: function() {
            console.log('onChange');
            this.render();
        },

        onChatChange: function() {
            console.log('onChatChange');
            this.render();
        },

        onTopicChange: function() {
            console.log('onTopicChange');
            this.render();
        },

        render: function() {
            if (this.chatModel.isLoaded() && this.topicModel.isLoaded()) {
                console.log('reel item view render');
                var context = {
                    chat: this.chatModel,
                    topic: this.topicModel,
                    fmt: this.fmt
                };
                this.$el.html(this.template(context));
            } else {
                console.log('data not ready');
            }
            return this;
        }
    });

    /**
     * HighlightReelListView View
     * @constructor
     * @param {Object} options
     *   collection: {ChatReelCollection} a sortable collection (required)
     */
    var HighlightReelListView = ui.collection.views.OrderedListView.extend({

        initialize: function(options) {
            _.extend(options, {
                viewFactory: new core.factory.Factory(HighlightReelItemView, {}),
                modelRankAttribute: 'rank',
                sort: this.viewSort
            });
            this.collection = options.collection;

            // setup data bindings
            this.listenTo(this.collection, 'change:rank', this.change);
            // Calling save on the collection after 'remove' event will
            // destroy the removed model.
            this.listenTo(this.collection, 'remove', this.save);

            // invoke super
            ui.collection.views.OrderedListView.prototype.initialize.call(this, options);
        },

        change: function() {
            console.log('ListView onChange');
            this.save();
        },

        save: function() {
            var eventBody = {
                collection: this.collection
            };
            this.collection.each(function(model){
                console.log(model.toJSON());
            });
            this.triggerEvent(events.UPDATE_CHAT_REEL, eventBody);
        },

        /**
         * viewSort
         * HighlightReelListView requires a sort function to be defined that the
         * underlying CollectionView will use to sort the views in the collection.
         * @param view
         * @returns {number}
         */
        viewSort: function(view) {
            var ret = 0;
            if (view && view.model) {
                ret = view.model.get_rank();
            }
            return ret;
        }
    });

    /**
     * HighlightReelView View
     * @constructor
     * @param {Object} options
     *   collection: {ChatReelCollection} object (required)
     */
    var HighlightReelView = core.view.View.extend({

        reelSelector: '.reel-hook',
        addReelSelector: '.add-reel-hook',

        events: {
        },

        childViews: function() {
            return [
                this.addReelView,
                this.reelView
            ];
        },

        initialize: function(options) {
            var userModel = new api.models.User({id: 'CURRENT'});
            this.collection = options.collection;
            // HighlightReelListView requires a sortable collection
            this.collection.comparator = function(model) {
                return model.get_rank();
            };
            this.template =  _.template(reel_template);

            this.collection.filterBy({user_id: userModel.id}).orderBy('rank').fetch({
                success: _.bind(this.render, this) // TODO test
            });

            //child views
            this.addReelView = null;
            this.reelView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.addReelView = new AddReelButtonView({
                collection: this.collection
            });
            this.reelView = new HighlightReelListView({
                collection: this.collection
            });
        },

        render: function() {
            this.$el.html(this.template());
            if (this.collection.isLoaded()) {
                this.append(this.reelView, this.reelSelector);
                this.append(this.addReelView, this.addReelSelector);
            }
            return this;
        }
    });

    return {
        AddReelButtonView: AddReelButtonView,
        AddReelModalView: AddReelModalView,
        ChatSelectView: ChatSelectView,
        HighlightReelItemView: HighlightReelItemView,
        HighlightReelListView: HighlightReelListView,
        HighlightReelView: HighlightReelView
    };
});
