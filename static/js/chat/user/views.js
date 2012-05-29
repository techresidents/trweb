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

        initialize: function() {
            this.template = _.template(user_template);

            this.user = this.model;
            this.chatSession = this.options.chatSession;
            this.css = this.options.css;
            
            //bind events
            /*
            this.user.bind('change', this.render, this);
            this.chatSession.bind('session:connected', this.sessionConnected, this);
            this.chatSession.bind('connection:created', this.connectionCreated, this);
            this.chatSession.bind('connection:destroyed', this.connectionDestroyed, this);
            this.chatSession.bind('stream:created', this.streamCreated, this);
            this.chatSession.bind('stream:destroyed', this.streamDestroyed, this);
            this.chatSession.bind('microphone:changed', this.microphoneChanged, this);
            */

            //views
            this.headerView = new ChatUserHeaderView({
                model: this.model
            });

            this.footerView = new ChatUserFooterView({
                model: this.model
            });
        },

        render: function() {
            
            this.headerView.render();
            this.$el.append(this.headerView.el);

            //if not already connected it's safe to render all of the templates.
            //if we are conncted than tokbox will have replaced elements in 
            //the chat-user-template with the video player, so we can no longer
            //re-render it.
            if(!this.user.isConnected()) {
                this.$el.append(this.template(this.model.toJSON()));
                this.$el.addClass(this.css);
                /*
                if(this.user.id == this.chatSession.getCurrentUser().id) {
                    this.spinner = new spin.Spinner({left: 200, top: 100}).spin(this.el);
                }
                */

            } else {
                /*
                if(this.user.id == this.chatSession.getCurrentUser().id) {
                    this.spinner.stop();
                }
                */
            }
            
            this.footerView.render();
            this.$el.append(this.footerView.el);
            
            return this;
        },

        //Server side associated a JSON object with each connection
        //containing user details (id, etc...). This allows us to
        //determine which connection is associated with this view
        //by comparing the view's user.id with connection user id.
        filterConnections: function(connections) {
            var session = this.chatSession.getSession();

            for(var i = 0; i < connections.length; i++) {
                var connection = connections[i];
                if(JSON.parse(connection.data).id == this.user.id) {
                    return connection;
                }
            }

            return null;
        },

        filterStreams: function(streams) {
            var session = this.chatSession.getSession();

            for(var i = 0; i < streams.length; i++) {
                var stream = streams[i];

                if(JSON.parse(stream.connection.data).id == this.user.id) {
                    return stream;
                }
            }

            return null;
        },

        getStreamViewDetails: function() {
            var container = this.$('.chat-user-container');

            return {
                elementId: 'user' + this.user.id,
                width: container.width(),
                height: container.height(),
            };

        },

        sessionConnected: function(event) {
            var connection = this.filterConnections(event.connections);
            if(connection) {
                this.user.setConnected(true);

                var session = this.chatSession.getSession();
                if(session.connection.connectionId == connection.connectionId) {
                    var container = this.$('.chat-user-container');
                    session.publish( 'user' + this.user.id, {
                            width: container.width(),
                            height: container.height(),
                            encodedWidth: container.width(),
                            encodedHeight: container.height(),
                            reportMicLevels: true
                    });
                } 

                this.streamCreated(event);
            }
        },

        connectionCreated: function(event) {
            var connection = this.filterConnections(event.connections);
            if(connection) {
                this.user.setConnected(true);
            }
        },

        connectionDestroyed: function(event) {
            var connection = this.filterConnections(event.connections);
            if(connection) {
                this.user.setConnected(false);
            }
        },

        streamCreated: function(event) {
            var stream = this.filterStreams(event.streams);
            if(stream) {
                var session = this.chatSession.getSession();
                this.user.setStreamId(stream.streamId);

                if(stream.connection.connectionId != session.connection.connectionId) {
                    var container = this.$('.chat-user-container');
                    session.subscribe(
                        stream,
                        'user' + this.user.id,
                        { width: container.width(), height: container.height() }
                    );
                } 

                this.user.setPublishing(true);
            }
        },

        streamDestroyed: function(event) {
            var stream = this.filterStreams(event.streams);
            if(stream) {
                this.user.setPublishing(false);
            }
        },

        microphoneChanged: function(event) {
            console.log(event.volume);
            this.$('.chat-user-container').addStyle('speaking');
            //console.log(event.volume);
            //console.log(event.target.connection.data);
        }
    });


    return {
        ChatUserView: ChatUserView,
    }
});
