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
     * AddChatButtonView View
     * @constructor
     * @param {Object} options
     *   collection: {ChatReelCollection} object (required)
     */
    var AddChatButtonView = core.view.View.extend({

        events: {
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
        }
    });

    /**
     * ChatSelectView.
     * This view displays a search input and matched list chats that the
     * user can add to their highlight reel. If the user's chat is already
     * in their highlight reel, then that chat will not be displayed.
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

            /* This query factory is used to seed autocomplete results. These
               initial results will then be parsed by the user's search string.*/
            this.queryFactory = function(options) {
                var chatCollection = that.userModel.get_chats();
                return chatCollection.withRelated('topic').filterBy({
                    'topic__title__istartswith': options.search
                });
            };

            /* A matcher is used to compare the results of the query with
               the search string specified by the user. This function
               is used to convert the chat models returned by the query factory
               into a searchable string (so that the matching can happen against
               the user specified string).*/
            this.stringify = function(model) {
                return model.get_topic().get_title();
            };

            /* Convert *matched* chat models into a simplified object to display
               in the list of results. */
            this.resultsMap = function(model) {
                var ret = null;
                // To prevent using a crazy query factory, filter the results
                // further to only return chats that are not already included
                // in the ChatReel collection.
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
            var context = {};
            this.$el.html(this.template(context));
            this.append(this.autoSelectView, this.autoSelectViewSelector);
            return this;
        }
    });

    /**
     * AddChatModalView View
     * @constructor
     * This view is designed to be used within a ModalView.
     * It specifies the view to display within the modal,
     * which modal buttons to show, and the behavior
     * when the modal buttons are clicked.
     * @param {Object} options
     *  chatReelCollection: {ChatReelCollection} object (required)
     */
    var AddChatModalView = core.view.View.extend({

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

            // populate initial list of chats
            this.chatSelectView.autoSelectView.refresh();
            this.$('input').focus(); // TODO not working

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
     * ChatReelItemView View
     * @constructor
     * @param {Object} options
     *   model: {ChatReel} object (required)
     */
    var ChatReelItemView = core.view.View.extend({

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
     * ChatReelListView View
     * @constructor
     * @param {Object} options
     *   collection: {ChatReelCollection} a sortable collection (required)
     */
    var ChatReelListView = ui.collection.views.OrderedListView.extend({

        initialize: function(options) {
            _.extend(options, {
                viewFactory: new core.factory.Factory(ChatReelItemView, {}),
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
         * ChatReelListView requires a sort function to be defined that the
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
     * ChatReelView View
     * @constructor
     * @param {Object} options
     *   collection: {ChatReelCollection} object (required)
     */
    var ChatReelView = core.view.View.extend({

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
            // ChatReelListView requires a sortable collection
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
            this.addReelView = new AddChatButtonView({
                collection: this.collection
            });
            this.reelView = new ChatReelListView({
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
        AddChatButtonView: AddChatButtonView,
        AddChatModalView: AddChatModalView,
        ChatSelectView: ChatSelectView,
        ChatReelItemView: ChatReelItemView,
        ChatReelListView: ChatReelListView,
        ChatReelView: ChatReelView
    };
});
