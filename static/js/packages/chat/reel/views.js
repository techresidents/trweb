define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'events',
    'ui',
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
    add_reel_template,
    reel_item_template,
    reel_template) {

    /**
     * AddReelView View
     * @constructor
     * @param {Object} options
     *   collection: {ChatReelCollection} object (required)
     */
    var AddReelView = core.view.View.extend({

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
            this.listenTo(this.model, 'change', this.onChange);
            this.listenTo(this.chatModel, 'change', this.onChatChange);
            this.listenTo(this.topicModel, 'change', this.onTopicChange);

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
                console.log('render');
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
     *   collection: {ChatReelCollection} object (required)
     */
    var HighlightReelListView = ui.collection.views.OrderedListView.extend({

        initialize: function(options) {
            _.extend(options, {
                viewFactory: new core.factory.Factory(HighlightReelItemView, {}),
                modelRankAttribute: 'rank',
                sort: this.viewSort
            });
            this.collection = options.collection;
            // OrderedListView requires a sortable collection
            this.collection.comparator = function(model) {
                return model.get_rank();
            };

            // setup data bindings
            this.listenTo(this.collection, 'change:rank', this.save);
            // Calling save on the collection after 'remove' event will
            // destroy the removed model.
            this.listenTo(this.collection, 'remove', this.save);

            // invoke super
            ui.collection.views.OrderedListView.prototype.initialize.call(this, options);
        },

        save: function() {
            var eventBody = {
                collection: this.collection
            };
            console.log('ReelList save');
            console.log(this.collection.toJSON());
            //this.triggerEvent(events.UPDATE_TALKING_POINTS, eventBody);
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
            this.template =  _.template(reel_template);

            this.collection.filterBy({user_id: userModel.id}).fetch({
                success: _.bind(this.render, this) // TODO test
            });

            //child views
            this.addReelView = null;
            this.reelView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.addReelView = new AddReelView({
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
        HighlightReelItemView: HighlightReelItemView,
        HighlightReelListView: HighlightReelListView,
        HighlightReelView: HighlightReelView
    };
});
