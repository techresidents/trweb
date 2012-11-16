define([
    'jquery',
    'underscore',
    'core/view',
    'lookup/views',
    'text!chat/tag/templates/tagger.html',
    'text!chat/tag/templates/tagger_item.html'
], function(
    $,
    _,
    view,
    lookup,
    tagger_template,
    tagger_item_template) {
    
    /**
     * Tag View Events
     */
    var EVENTS = {
        ADD_TAG: 'tag:addTag',
        DELETE_TAG: 'tag:deleteTag'
    };

    /**
     * Chat tagger list item view.
     * @constructor
     * @param {Object} options
     *   model: Tag model (required)
     */
    var ChatTaggerItemView = view.View.extend({

        tagName: 'li',

        events: {
            'click .destroy': 'destroy'
        },

        initialize: function() {
            this.template = _.template(tagger_item_template);
            this.users = this.options.users;
            this.model.bind('destroy', this.remove, this);
        },

        
        render: function() {
            var timestamp = this.model.timestamp_as_date();
            var user = this.users.get(this.model.userId());
            var state = _.extend(this.model.toJSON(), {
                user: user.toJSON(),
                myTag: user.isCurrentUser(),
                time: timestamp.getHours() + ':' + timestamp.getMinutes()
            });
            this.$el.html(this.template(state));
            this.$('[rel=tooltip]').tooltip();
            return this;
        },

        destroy: function() {
            this.triggerEvent(EVENTS.DELETE_TAG, {
                tagModel: this.model
            });
        }
    });

    
    /**
     * Chat tagger list view.
     * @constructor
     * @param {Object} options
     *   collection: TagCollection (required)
     *   filter: callback method to filter displayed
     *      tags. Method will receive the Tag object
     *      as its sole parameter and should return
     *      a boolean indicated whether the tag
     *      should be displayed (optional)
     *   context: callback context (optional)
     *   maxItems: max number of visibile items (optional)
     */
    var ChatTaggerListView = view.View.extend({

        tagName: 'ul',
        
        initialize: function() {
            this.users = this.options.users;
            this.filter = this.options.filter || this._passThroughFilter;
            this.context = this.options.context || this;
            this.maxItems = this.options.maxItems;
            this.collection.bind('reset', this.render, this);
            this.collection.bind('add', this.added, this);
            this.itemViews = [];
        },

        render: function() {
            this.collection.each(this.added, this);
            return this;
        },
        
        added: function(model) {
            var view = new ChatTaggerItemView({
                users: this.users,
                model: model
            }).render();

            view.$el.fadeTo(1000, 1);
            this.$el.prepend(view.el);
            view.$el.toggle(this.filter.call(this.context, view.model));
            this.itemViews.push(view);

            this._enforceMaxItems();
        },

        applyFilter: function() {
            var that=this;
            _.each(this.itemViews, function(view) {
                view.$el.toggle(that.filter.call(that.context, view.model));
            });

            this._enforceMaxItems();
        },

        _passThroughFilter: function(tag) {
            return true;
        },

        _enforceMaxItems: function() {
            var i;
            var visibleItems = 0;
            if(this.maxItems) {
                for(i = this.itemViews.length - 1; i >= 0; i--) {
                    var view = this.itemViews[i];
                    if(view.$el.is(':visible')) {
                        if(visibleItems >=  this.maxItems) {
                            view.$el.toggle(false);
                        } else {
                            visibleItems++;
                        }
                    }
                }
            }
        }
    });


    /**
     * Chat tagger view.
     * @constructor
     * @param {Object} options
     *   collection: {TagCollection} (required)
     *   maxItems: maximum tags to show (optional)
     *   filter: tag filter method (optional)
     */
    var ChatTaggerView = view.View.extend({

        inputSelector: 'input',

        listSelector: 'ul',

        events: {
            'click .add': 'addTag'
        },

        initialize: function() {
            this.template =  _.template(tagger_template);
            this.users = this.options.users;
            this.maxItems = this.options.maxItems;
            this.filter = this.options.filter;
            this.enabled = false;
            this.tagInput = null;
            this.lastSelectedTag = null;

            //child views
            this.lookupView = null;
            this.taggerListView = null;
        },

        enable: function(enabled) {
            this.enabled = enabled;
            this.render();
        },

        render: function() {
            var state = { enabled: this.enabled };
            this.$el.html(this.template(state));

            this.tagInput = this.$(this.inputSelector);
            
            this.lookupView = new lookup.LookupView({
                el: this.tagInput,
                scope: 'tag',
                property: 'name',
                forceSelection: false,
                onenter: this.updateOnEnter,
                onselect: this.onSelect,
                context: this
            });
            
            this.taggerListView = new ChatTaggerListView({
                el: this.$(this.listSelector),
                users: this.users,
                collection: this.collection,
                maxItems: this.maxItems,
                filter: this.filter
            }).render();

            return this;
        },

        addTag: function() {
            var value = this.tagInput.val();
            if(this.enabled && value) {
                event = {
                    tagReferenceId: null,
                    conceptId: null,
                    tagValue: value
                };

                if(this.lastSelectedTag &&
                   this.lastSelectedTag.name === value) {
                    _.extend(event, {
                        tagReferenceId: this.lastSelectedTag.id,
                        conceptId: this.lastSelectedTag.conceptId
                    });
                }

                this.triggerEvent(EVENTS.ADD_TAG, event);
                this.tagInput.val(null);
                this.tagInput.focus();
            }
        },

        applyFilter: function() {
            if(this.taggerListView) {
                this.taggerListView.applyFilter();
            }
        },

        updateOnEnter: function(value, data) {
            this.lastSelectedTag = data;
            this.addTag();
        },

        onSelect: function(value, data) {
            this.lastSelectedTag = data;
        }
    });

    return {
        EVENTS: EVENTS,
        ChatTaggerView: ChatTaggerView,
        ChatTaggerListView: ChatTaggerListView
    };
});
