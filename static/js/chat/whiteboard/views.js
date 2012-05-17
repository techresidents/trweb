define([
    'jQuery',
    'Underscore',
    'Backbone',
    'whiteboard/views',
    'chat/whiteboard/models',
    'whiteboard/serialize',
], function($, _, Backbone, whiteboardViews, whiteboardModels, serialize) {


    /**
     * Whiteboard view.
     * @constructor
     */
    var ChatWhiteboardView = whiteboardViews.WhiteboardView.extend({

        initialize: function() {
            whiteboardViews.WhiteboardView.prototype.initialize.call(this);

            this.chatSessionToken = this.options.chatSessionToken;
            this.userId = this.options.userId;

            //this.chatMessageCollection = this.options.chatMessageCollection;
            //this.chatMessageCollection.bind('reset', this.reset, this);
            //this.chatMessageCollection.bind('add', this.added, this);
            
            this.serializer = new serialize.Serializer();
        },

        reset: function() {
        },

        added: function(model) {
            if(model.msgType() != 'whiteboard') {
                return;
            }
            
            var msg = model.get('msg');
            this.paper.add(this.serializer.deserializeElement(msg.data));
        },

        onElementAdded: function(tool, element) {
            /*
            whiteboardViews.WhiteboardView.prototype.onElementAdded.call(this, tool, element);

            var header = new messages.MessageHeader({
                    chatSessionToken: this.chatSessionToken,
                    userId: this.userId
            });

            var msg = new messages.WhiteboardCreateMessage({
                    data: this.serializer.serializeElement(element)
            });


            var message = new models.ChatMessage({
                    header: header,
                    msg: msg
            });

            message.save();
            //element.remove();
            */
        }
    });


    /**
     * Whiteboard container view.
     * This view will be responsible for displaying all of the
     * tools and other whiteboard action buttons. This view
     * will remain visible regardless of which specific whiteboard
     * is being viewed.
     */
    var ChatWhiteboardControlsView = Backbone.View.extend({

        templateSelector: '#whiteboard-controls-template',
        events: {
            "click button": "addButtonHandler"
        },

        initialize: function() {
            this.setElement($("#whiteboard-controls"));
            this.template = _.template($(this.templateSelector).html());
            this.collection.bind("reset", this.render, this);
            this.collection.bind("add", this.added, this);
        },

        render: function() {
            console.log('render control view');
            this.collection.each(this.added, this);
            this.$el.html(this.template());
            return this;
        },

        added: function(model) {
            console.log('added function called in control view');
        },

        addButtonHandler: function() {
            console.log('whiteboard button clicked');
            var whiteboard = new whiteboardModels.Whiteboard({
                name: 'whiteboard7',
            });
            whiteboard.save();
        }
    });

    /**
     * Whiteboard tab view.
     * @constructor
     */
    var ChatWhiteboardTabView = Backbone.View.extend({

        initialize: function() {
        },

        render: function() {
            new ChatWhiteboardControlsView({
                collection: whiteboardModels.whiteboardCollection
            }).render();

        }
    });

    return {
        ChatWhiteboardTabView: ChatWhiteboardTabView
    }
});
