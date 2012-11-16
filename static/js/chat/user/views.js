define([
    'jquery',
    'underscore',
    'backbone',
    'spin',
    'text!chat/user/templates/user.html',
    'text!chat/user/templates/user_header.html',
    'text!chat/user/templates/user_footer.html'
], function(
    $,
    _,
    Backbone,
    Spinner,
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
        }

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
        }

    });


    /**
     * Chat user view.
     * @constructor
     * @param {Object} options
     *   model: User model (required)
     *   collection: Users collection (required)
     */
    var ChatUserView = Backbone.View.extend({

        chatContainerSelector: '.chat-participant-container',

        speakingStyle: 'speaking',

        initialize: function() {
            this.template = _.template(user_template);

            this.user = this.model;
            this.users = this.collection;
            this.usersLength = null;

            this.headerSelector = '.chat-participant-header';
            this.footerSelector = '.chat-participant-footer';
            
            //bind events
            this.user.bind('change:isConnected', this.render, this);
            this.user.bind('change:isPublishing', this.render, this);
            this.user.bind('change:isSpeaking', this.onSpeakingChanged, this);
            this.users.bind('add', this.render, this);
            this.users.bind('remove', this.render, this);

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
                if(this.user.isCurrentUser()) {
                    this.spinner = new Spinner({left: 200, top: 100}).spin(this.el);
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
            
            //add speaking style
            this.$(this.chatContainerSelector).toggleClass('speaking', this.user.isSpeaking());
            
            //add style indicating number of chat participants.
            //this is useful for sizing the view through css
            if(this.usersLength !== this.users.length) {
                this.$el.removeClass('chat-participants' + this.usersLength);

                this.usersLength = this.users.length;
                this.$el.addClass('chat-participants' + this.usersLength);
            }
            
            return this;
        },

        onSpeakingChanged: function() {
            this.$(this.chatContainerSelector).toggleClass(this.speakingStyle, this.user.isSpeaking());
        },

        getStreamViewDetails: function() {
            var container = this.$(this.chatContainerSelector);

            return {
                elementId: 'participant' + this.user.participant(),
                width: container.width(),
                height: container.height()
            };

        }
    });


    return {
        ChatUserView: ChatUserView
    };
});
