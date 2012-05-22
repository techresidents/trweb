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
            "change #select-whiteboard": "selectionUpdate",
            "click #whiteboard-add-button": "addButtonHandler",
            "click #whiteboard-delete-button": "deleteButtonHandler"
        },

        initialize: function() {
            this.setElement($("#whiteboard-controls"));
            this.template = _.template($(this.templateSelector).html());

            // Create a whiteboard if one doesn't already exist.
            // Note that this block of code could be invoked even
            // if the collection is not empty due to the delay in
            // receiving the chat data from the long poll.  For this
            // reason, the WhiteboardCollection will not add models
            // to the collection that have a duplicate name; thus, in
            // this case, a duplicate default whiteboard will not be added.
            if (this.collection.length < 1){
                console.log('Creating a default whiteboard');
                var whiteboard = new whiteboardModels.Whiteboard({
                    name: 'Default Whiteboard',
                });
                whiteboard.save();
            }

            // TODO not sure if I should do these two steps or not. Is it worthwhile if user doesn't have the data yet?
            this.jsonWhiteboardList = {'whiteboardCollection': this.collection.toJSON()};
            //this.collection.each(this.added, this);

            this.collection.bind("reset", this.render, this);
            this.collection.bind("add", this.added, this);
            this.collection.bind("remove", this.removed, this);
        },

        render: function() {
            console.log('rendering control view');
            console.log(this.collection.toJSON());
            this.$el.html(this.template(this.jsonWhiteboardList));
            return this;
        },

        /**
         * This method is responsible for updating the list of whiteboards and
         * creating a new view for each whiteboard when it is created.
         * @param model
         */
        added: function(model) {
            console.log('added() called');
            //console.log(model.myWhiteboard); // TODO switch to new whiteboard if user added it
            this.jsonWhiteboardList = {'whiteboardCollection': this.collection.toJSON()};
            this.render();
        },

        /**
         * This method is responsible for updating the list of whiteboards and
         * deleting the whiteboard's view object.
         * @param model
         */
        removed: function(model) {
            console.log('removed() called');
            this.jsonWhiteboardList = {'whiteboardCollection': this.collection.toJSON()};
            this.render();
        },

        /**
         * Responsible for showing/hiding the appropriate whiteboard
         * when the user's WB selection changes.
         */
        selectionUpdate: function(){
            this.selected = this.$el.find('#select-whiteboard').val();
            console.log('selected whiteboard id: ' + this.selected);

        },


        /**
         * This button listens to the create-whiteboard modal dialog's
         * success button.
         */
        addButtonHandler: function() {

            // read input whiteboard name
            var wbNameInput = this.$('#whiteboard-name-input');
            var wbName = wbNameInput.val();

            // validate the input whiteboard name
            if (wbName == '' || wbName.length == 0){
                wbName = 'Whiteboard #' + parseInt(this.collection.length+1);
            }

            // clear name field
            wbNameInput.val('');

            // max number of whiteboards is 10
            if (this.collection.length <= 10){
                var whiteboard = new whiteboardModels.Whiteboard({
                    name: wbName
                });
                whiteboard.save();
            }

            // hide modal dialog when done
            this.$el.find('#create-whiteboard-modal').modal('hide');
        },

        deleteButtonHandler: function() {
            // minimum number of whiteboards is 1
            if (this.collection.length > 1) {
                var currentlySelectedWhiteboardId = this.$el.find('#select-whiteboard').val();
                var wb = this.collection.get(currentlySelectedWhiteboardId);
                // don't allow users to delete the default whiteboard
                if (wb.name() != 'Default Whiteboard'){
                    console.log('Deleting whiteboard: ' + wb.name());
                    wb.destroy();
                }
            }
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
