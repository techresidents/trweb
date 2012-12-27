define([
    'jquery',
    'underscore',
    'jquery.bootstrap',
    'core/view',
    'api/models',
    'apps/highlight/models',
    'text!apps/highlight/templates/chat_session.html',
    'text!apps/highlight/templates/chat_sessions.html',
    'text!apps/highlight/templates/highlight_session.html',
    'text!apps/highlight/templates/highlight_sessions.html',
    'text!apps/highlight/templates/alert_status.html'
], function(
    $,
    _,
    none,
    view,
    api,
    highlight_models,
    chat_session_template,
    chat_sessions_template,
    highlight_session_template,
    highlight_sessions_template,
    alert_status_template) {

    /**
     * View Events
     */
    var EVENTS = {
        HIGHLIGHT_SESSION_UP: 'HIGHLIGHT_SESSION_UP_EVENT',
        HIGHLIGHT_SESSION_DOWN: 'HIGHLIGHT_SESSION_DOWN_EVENT'
    };

    /**
     * Chat Session View.
     * @constructor
     * @param {Object} options
     *   model: {ChatSessionUIModel} (required)
     */
    var ChatSessionView = view.View.extend({
        tagName: 'li',

        events: {
            'click input': 'onClick'
        },

        childViews: function() {
            return [];
        },

        initialize: function(options) {
            this.template =  _.template(chat_session_template);
            this.model.bind('loaded', this.loaded, this);
        },

        render: function() {
            var context = {
                model: this.model.toJSON({withRelated: true}),
                fmt: this.fmt // date formatting
            };
            this.$el.html(this.template(context));
            this.$('input').prop('checked', this.model.selected());
            
            return this;
        },

        onClick: function(e) {
            this.model.setSelected(e.currentTarget.checked);
        }
    });


    /**
     * Chat Sessions View.
     * @constructor
     * @param {Object} options
     *   collection: {ChatSessionCollection} (required)
     *   highlightSessionCollection: {HighlightSessionCollection} (required)
     *   user: {User} model (required)
     */
    var ChatSessionsView = view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.template =  _.template(chat_sessions_template);
            this.user = options.user;
            this.highlightSessionCollection = options.highlightSessionCollection;
            this.collection.bind('reset', this.render, this);
            this.collection.bind('add', this.added, this);
            this.highlightSessionCollection.bind('reset', this.render, this);
        },

        render: function() {
            this.originalHighlightCollection = new api.HighlightSessionCollection(
                this.highlightSessionCollection.models);

            _.each(this.childViews, function(view) {
                view.destroy();
            });

            this.$el.html(this.template());

            this.childViews = [];
            this.$el.html(this.template());
            this.collection.each(this.added, this);
            
            return this;
        },

        added: function(chatSession) {
            var highlight_sessions = this.highlightSessionCollection.where({
                chat_session_id: chatSession.id
            });

            var selected = highlight_sessions.length > 0 ? true : false;

            var model = new highlight_models.ChatSessionUIModel({
                chatSession: chatSession,
                selected: selected
            });
            model.bind('change:selected', this.onSelectedChange, this);

            var view = new ChatSessionView({
                model: model
            }).render();

            this.childViews.push(view);
            this.$('ul').append(view.el);
        },

        onSelectedChange: function(model, options) {
            if(model.selected()) {
                var highlightSession;
                var originalHighlights = this.originalHighlightCollection.where({
                    chat_session_id: model.chatSession().id
                });

                if(originalHighlights.length) {
                    highlightSession = originalHighlights[0];
                    highlightSession.set({rank: this.highlightSessionCollection.length});
                } else {
                    highlightSession = new api.HighlightSession({
                        user_id: this.user.id,
                        chat_session_id: model.chatSession().id,
                        rank: this.highlightSessionCollection.length
                    });
                }
                highlightSession.set_chat_session(model.chatSession());
                this.highlightSessionCollection.add(highlightSession);

            } else {
                var highlightSessions = this.highlightSessionCollection.where({
                    chat_session_id: model.chatSession().id
                });
                if(highlightSessions.length) {
                    this.highlightSessionCollection.remove(highlightSessions[0]);
                }
            }
        }

    });

    /**
     * Highlight Session View.
     * @constructor
     * @param {Object} options
     *   model: {HighlightSession} (required)
     */
    var HighlightSessionView = view.View.extend({
        tagName: 'li',

        events: {
            'click .up': 'onUp',
            'click .down': 'onDown'
        },

        childViews: function() {
            return [];
        },

        initialize: function(options) {
            this.template =  _.template(highlight_session_template);
            this.model.bind('remove', this.removed, this);
        },

        render: function() {
            console.log('SessionView render');
            var context = {
                model: this.model.toJSON({withRelated: true}),
                fmt: this.fmt // date formatting
            };
            console.log(context);
            this.$el.html(this.template(context));
            this.$("[rel=tooltip]").tooltip();
            
            return this;
        },

        removed: function() {
            this.destroy();
        },

        onUp: function(e) {
            // Need to hide tooltip since this view will be removed
            // from the DOM before the mouseleave() event fires
            this.$("[rel=tooltip]").tooltip('hide');
            this.triggerEvent(EVENTS.HIGHLIGHT_SESSION_UP, this.model);
        },

        onDown: function(e) {
            // Need to hide tooltip since this view will be removed
            // from the DOM before the mouseleave() event fires
            this.$("[rel=tooltip]").tooltip('hide');
            this.triggerEvent(EVENTS.HIGHLIGHT_SESSION_DOWN, this.model);
        }
    });


    /**
     * Highlight Sessions View.
     * @constructor
     * @param {Object} options
     *   collection: {HighlightSessionCollection} (required)
     */
    var HighlightSessionsView = view.View.extend({

        saveStatusSelector: '.save-status',

        events: {
            'click .save': 'onSave',
            'HIGHLIGHT_SESSION_UP_EVENT': 'onUp',
            'HIGHLIGHT_SESSION_DOWN_EVENT': 'onDown'
        },

        initialize: function(options) {
            this.template =  _.template(highlight_sessions_template);
            this.collection.bind('reset', this.render, this);
            this.collection.bind('change:rank', this.rankChanged, this);
            this.collection.bind('add', this.added, this);
            this.collection.bind('remove', this.removed, this);
        },

        render: function() {
            console.log('SessionsView render');
            _.each(this.childViews, function(view) {
                view.destroy();
            });

            this.$el.html(this.template());

            this.childViews = [];
            this.$el.html(this.template());
            _.each(this.collection.sortBy(function(model) {
                return model.get_rank();
            }), this.added, this);
            
            return this;
        },

        added: function(model) {
            // remove save status view if user has added
            // a chat to their highlight reel
            this.removeSaveStatusView();

            var view = new HighlightSessionView({
                model: model
            }).render();

            this.childViews.push(view);
            this.$('ol').append(view.el);
        },

        removed: function(model) {
            // remove save status view if user has removed
            // a chat to their highlight reel
            this.removeSaveStatusView();

            this.collection.each(function(m) {
                if(m.get_rank() > model.get_rank()) {
                    m.set_rank(m.get_rank() - 1);
                }
            });
            this.render();
        },

        rankChanged: function(model) {
        },

        /**
         * Function to remove the save status view
         * from the DOM.  Should be called if user
         * updates their highlight reel in any way.
         */
        removeSaveStatusView: function() {
            this.$(this.saveStatusSelector).children().remove();
        },

        onSave: function(e) {
            var that = this;
            this.collection.save({
                success: function(collection) {

                    // Remove status view if one is already there.
                    // This prevents multiple status views from appearing
                    // if user repeatedly hits the save button.
                    that.removeSaveStatusView();

                    // create and add status view to DOM
                    var view = new AlertStatusView({
                        type: 'alert-success',
                        message: 'Save successful'
                    }).render();
                    that.$(that.saveStatusSelector).append(view.el);
                }
            });
        },

        onUp: function(e, model) {
            var rank = model.get_rank();
            if(rank !== 0) {
                this.collection.each(function(m) {
                    if(m.cid !== model.cid &&
                        m.get_rank() === rank - 1) {
                        m.set_rank(m.get_rank() + 1);
                    }
                });
                model.set_rank(rank - 1);
                this.render();
            }
        },

        onDown: function(e, model) {
            var rank = model.get_rank();
            if(rank < this.collection.length - 1) {
                this.collection.each(function(m) {
                    if(m.cid !== model.cid &&
                        m.get_rank() === rank + 1) {
                        m.set_rank(m.get_rank() - 1);
                    }
                });
                model.set_rank(rank + 1);
                this.render();
            }
        }

    });


    /**
     * Alert Status View.
     * @constructor
     * @param {Object} options
     *   type: Supported strings are:  (required)
     *          'alert-success',
     *          'alert-error',
     *          'alert-info',
     *          'alert-warning'
     *   message: message string to display (required)
     */
    var AlertStatusView = view.View.extend({

        events: {
            'click .remove': 'removed'
        },

        childViews: function() {
            return [];
        },

        initialize: function(options) {
            this.type = options.type;
            this.message = options.message;
            this.template =  _.template(alert_status_template);
        },

        render: function() {
            var context = {
                message: this.message
            };
            this.$el.html(this.template(context));
            this.$('.alert').addClass(this.type);

            return this;
        },

        removed: function() {
            this.destroy();
        }
    });



    return {
        EVENTS: EVENTS,
        ChatSessionsView: ChatSessionsView,
        HighlightSessionsView: HighlightSessionsView
    };
});
