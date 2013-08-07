define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'events',
    'ui',
    '../views',
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
    profile_views,
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

            // child views
            this.addChatModalView = null;
        },

        childViews: function() {
            return [this.addChatModalView];
        },

        render: function() {
            this.$el.html(this.template());
            return this;
        },

        onAdd: function() {
            // Since we are showing a modal view, we don't have to
            // treat like a typical child view.  The modal view will destroy
            // itself when it loses focus.
            var modalOptions = {
                title: 'Add To Your Highlight Reel',
                viewOrFactory: new AddChatModalView({
                    chatReelCollection: this.collection
                })
            };
            this.addChatModalView = new ui.modal.views.ModalView(modalOptions);
            this.append(this.addChatModalView);
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
                queryFactory: new core.factory.FunctionFactory(this.queryFactory),
                stringify: this.stringify,
                sort: null,
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
            this.$el.html(this.template());
            this.append(this.autoSelectView, this.autoSelectViewSelector);
            this.autoSelectView.refresh();
            return this;
        },

        focus: function() {
            this.autoSelectView.input().focus();
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

            // Have to delay the focus event since this view's parent
            // hasn't been appended to the DOM.
            this.delayFocus();

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

        delayFocus: function() {
            var that = this;
            setTimeout(function() {
                that.chatSelectView.focus();
            }, 500);
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
            }
        }
    });

    /**
     * ChatReelView View
     * @constructor
     * @param {Object} options
     *   model: {ChatReel} object (required)
     */
    var ChatReelView = core.view.View.extend({

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
     * ChatReelCollectionView View
     * @constructor
     * @param {Object} options
     *   collection: {ChatReelCollection} a sortable collection (required)
     */
    var ChatReelCollectionView = ui.collection.views.OrderedListView.extend({

        initialize: function(options) {
            _.extend(options, {
                viewFactory: new core.factory.Factory(ChatReelView, {}),
                modelRankAttribute: 'rank',
                sort: this._viewSort
            });
            this.collection = options.collection;

            // invoke super
            ui.collection.views.OrderedListView.prototype.initialize.call(this, options);
        },

        /**
         * viewSort
         * ChatReelCollectionView requires a sort function to be defined that the
         * underlying CollectionView will use to sort the views in the collection.
         * @param view
         * @returns {number}
         */
        _viewSort: function(view) {
            var ret = 0;
            if (view && view.model) {
                ret = view.model.get_rank();
            }
            return ret;
        }
    });

    /**
     * ChatReelPageView View
     * @constructor
     * @param {Object} options
     *   collection: {ChatReelCollection} object (required)
     */
    var ChatReelPageView = core.view.View.extend({

        chatReelSelector: '.developer-profile-reel-list-hook',
        addChatButtonSelector: '.developer-profile-reel-add-hook',
        navSelector: '.developer-profile-reel-nav',
        saveBtnSelector: '.developer-profile-reel-save',

        events: {
            'click .developer-profile-reel-save': 'onSave'
        },

        childViews: function() {
            return [
                this.addChatButtonView,
                this.ChatReelCollectionView,
                this.navView
            ];
        },

        initialize: function(options) {
            var userModel = new api.models.User({id: 'CURRENT'});
            this.collection = options.collection;

            // data bindings
            this.listenTo(this.collection, 'loaded:read', this.loaded);

            // ChatReelCollectionView requires a sortable collection
            this.collection.comparator = function(model) {
                return model.get_rank();
            };
            this.template =  _.template(chat_reel_template);

            // fetch data
            this.collection.
                filterBy({user_id: userModel.id}).
                withRelated(['chat__topic']).
                orderBy('rank').
                fetch();

            // listen on changes to collection to enable the save btn
            this.listenTo(this.collection, 'add', this.enableSaveBtn);
            this.listenTo(this.collection, 'change:rank', this.enableSaveBtn);
            this.listenTo(this.collection, 'remove', this.enableSaveBtn);

            //child views
            this.addChatButtonView = null;
            this.ChatReelCollectionView = null;
            this.navView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this. navView = new profile_views.DeveloperProfileNavView();

            this.addChatButtonView = new AddChatButtonView({
                collection: this.collection
            });
            this.ChatReelCollectionView = new ChatReelCollectionView({
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
                this.append(this.navView, this.navSelector);
                this.append(this.ChatReelCollectionView, this.chatReelSelector);
                this.append(this.addChatButtonView, this.addChatButtonSelector);
            }
            return this;
        },

        onSave: function() {
            //TODO figure out why a remove event is being fired
            //when navigating away from reel to another in-app
            //page like Topics.

            // Triggering this event after a 'remove' event will
            // destroy the removed model.
            var eventBody = {
                collection: this.collection,
                onSuccess: this.disableSaveBtn()
            };
            this.triggerEvent(events.UPDATE_CHAT_REEL, eventBody);
        },

        enableSaveBtn: function() {
            this.$(this.saveBtnSelector).removeClass('disabled');
        },

        disableSaveBtn: function() {
            this.$(this.saveBtnSelector).addClass('disabled');
        }
    });

    return {
        ChatReelPageView: ChatReelPageView
    };
});
