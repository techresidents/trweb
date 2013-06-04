define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'events',
    'ui',
    'text!./templates/chat_select.html',
    'text!./templates/chat_select_list.html',
    'text!./templates/add_chat_button.html',
    'text!./templates/add_chat_modal.html',
    'text!./templates/chat_reel_item.html',
    'text!./templates/chat_reel.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    events,
    ui,
    chat_select_template,
    chat_select_list_template,
    add_chat_button_template,
    add_chat_modal_template,
    chat_reel_item_template,
    chat_reel_template) {

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
            this.template =  _.template(add_chat_button_template);
        },

        render: function() {
            this.$el.html(this.template());
            return this;
        },

        onAdd: function() {
             var modalOptions = {
                title: 'Add To Your Highlight Reel',
                viewOrFactory: new AddChatModalView({
                    chatReelCollection: this.collection
                })
            };
            var modalView = new ui.modal.views.ModalView(modalOptions);
            this.append(modalView);
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
                }).orderBy('start__desc');
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
               in the list of results. Must specify 'id' and 'value' attributes. */
            this.resultsMap = function(model) {
                var ret = null;
                // To prevent using a crazy query factory, filter the results
                // further to only return chats that are not already included
                // in the ChatReel collection.
                if (!that.chatReelCollection.where({chat_id: model.id}).length) {
                    var title = model.get_topic().get_title();
                    var date = that.fmt.date(model.get_start(), 'MM/dd/yy hh:mm tt');
                    ret = {
                        id: model.id,
                        value: title + ' ' + date,
                        title: title,
                        date: date
                    };
                }
                return ret;
            };

            // This matcher is used to compare the results of the query with
            // the search string specified by the user.
            this.chatMatcher = new ui.ac.matcher.QueryMatcher({
                sortByStringify: false,
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
                listTemplate: chat_select_list_template,
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
            this.template =  _.template(add_chat_modal_template);

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

            // TODO not working
            //this.chatSelectView.autoSelectView.inputHandlerView.something
            this.$('input:text:first').focus();

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
            this.template =  _.template(chat_reel_item_template);

            //load root topic and all sub-topic data
            this.loader = new api.loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated }
            ]);
            this.listenTo(this.loader, 'loaded', this.render);
            this.loader.load();
        },

        render: function() {
            if (this.chatModel.isLoaded() && this.topicModel.isLoaded()) {
                var context = {
                    chat: this.chatModel,
                    topic: this.topicModel,
                    fmt: this.fmt
                };
                this.$el.html(this.template(context));
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
            this.listenTo(this.collection, 'remove', this.remove);

            // invoke super
            ui.collection.views.OrderedListView.prototype.initialize.call(this, options);
        },

        remove: function() {
            this.save();
        },

        change: function() {
            this.save();
        },

        save: function() {
            var eventBody = {
                collection: this.collection
            };
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

        chatReelListSelector: '.chat-reel-list-hook',
        addChatButtonSelector: '.add-chat-btn-hook',

        events: {
        },

        childViews: function() {
            return [
                this.addChatButtonView,
                this.chatReelListView
            ];
        },

        initialize: function(options) {
            var userModel = new api.models.User({id: 'CURRENT'});
            this.collection = options.collection;

            // data bindings
            this.listenTo(this.collection, 'loaded:read', this.loaded);

            // ChatReelListView requires a sortable collection
            this.collection.comparator = function(model) {
                return model.get_rank();
            };
            this.template =  _.template(chat_reel_template);

            // fetch data
            this.collection.filterBy({user_id: userModel.id}).orderBy('rank').fetch({});

            //child views
            this.addChatButtonView = null;
            this.chatReelListView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.addChatButtonView = new AddChatButtonView({
                collection: this.collection
            });
            this.chatReelListView = new ChatReelListView({
                collection: this.collection
            });
        },

        loaded: function(collection) {
            if (collection === this.collection) {
                this.render();
            }
        },

        render: function() {
            this.$el.html(this.template());
            if (this.collection.isLoaded()) {
                this.append(this.chatReelListView, this.chatReelListSelector);
                this.append(this.addChatButtonView, this.addChatButtonSelector);
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
