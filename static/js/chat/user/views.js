define([
    'jQuery',
    'Underscore',
    'Backbone',
    'spin',
    'text!chat/user/templates/user.html',
    'text!chat/user/templates/user_header.html',
    'text!chat/user/templates/user_footer.html',
], function(
    $,
    _,
    Backbone,
    spin,
    user_template,
    user_header_template,
    user_footer_template) {

    /**
     * Chat user header view.
     * @constructor
     * @param {Object} options
     *   model: User model (required)
     */
    var ChatUserHeaderView = Backbone.View.extend({

        initialize: function() {
            this.template = _.template(user_header_template);
            this.model.bind('change', this.render, this);
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },

    });


    /**
     * Chat user footer view.
     * @constructor
     * @param {Object} options
     *   model: User model (required)
     *   templateSelector: html template selector (optional)
     */
    var ChatUserFooterView = Backbone.View.extend({

        initialize: function() {
            this.template = _.template(user_footer_template);
            this.model.bind('change', this.render, this);
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },

    });


    /**
     * Chat user view.
     * @constructor
     * @param {Object} options
     *   model: User model (required)
     *   chatSession: ChatSession model (required)
     *   css: style to add to view (optional)
     */
    var ChatUserView = Backbone.View.extend({

        chatContainerSelector: '.chat-user-container',

        speakingStyle: 'speaking',

        initialize: function() {
            this.template = _.template(user_template);

            this.user = this.model;
            this.chatSession = this.options.chatSession;
            this.css = this.options.css;

            this.headerSelector = '#user' + this.user.id + '-header';
            this.footerSelector = '#user' + this.user.id + '-footer';
            
            //bind events
            this.user.bind('change:isConnected', this.render, this);
            this.user.bind('change:isPublishing', this.render, this);
            this.user.bind('change:isSpeaking', this.onSpeakingChanged, this);

            //views
            this.headerView = new ChatUserHeaderView({
                model: this.model
            });

            this.footerView = new ChatUserFooterView({
                model: this.model
            });
        },

        render: function() {
            
            //if not already connected it's safe to render all of the templates.
            //if we are conncted than tokbox will have replaced elements in 
            //the chat-user-template with the video player, so we can no longer
            //re-render it.
            if(!this.user.isConnected()) {
                this.$el.html(this.template(this.model.toJSON()));
                this.$el.addClass(this.css);
                if(this.user.isCurrentUser()) {
                    this.spinner = new spin.Spinner({left: 200, top: 100}).spin(this.el);
                }

            } else {
                if(this.user.isCurrentUser()) {
                    this.spinner.stop();
                }
            }
            
            this.headerView.render();
            this.$(this.headerSelector).html(this.headerView.el);

            this.footerView.render();
            this.$(this.footerSelector).html(this.footerView.el);
            
            this.$('chat-user-container').toggleClass('speaking', this.user.isSpeaking());
            
            return this;
        },

        onSpeakingChanged: function() {
            this.$(this.chatContainerSelector).toggleClass(this.speakingStyle, this.user.isSpeaking());
        },

        getStreamViewDetails: function() {
            var container = this.$(this.chatContainerSelector);

            return {
                elementId: 'user' + this.user.id,
                width: container.width(),
                height: container.height(),
            };

        },
    });


    return {
        ChatUserView: ChatUserView,
    }
});
