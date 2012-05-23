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
            //this.whiteboardId = this.options.id;
            //this.chatSessionToken = this.options.chatSessionToken;
            //this.userId = this.options.userId;
            this.serializer = new serialize.Serializer();
        },

        reset: function() {
        },

        added: function(model) {
            var msg = model.get('msg');
            this.paper.add(this.serializer.deserializeElement(msg.data));
        },

        onElementAdded: function(tool, element) {
            whiteboardViews.WhiteboardView.prototype.onElementAdded.call(this, tool, element);
            /*
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
     * Mediator.
     * Responsible for coordinating and composing views together.
     */
    var ChatWhiteboardMediatorView = Backbone.View.extend({

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
            "change #select-whiteboard": "drawSelectedWhiteboard",
            "click #whiteboard-add-button": "addWhiteboardButtonHandler",
            "click #whiteboard-delete-button": "deleteWhiteboardButtonHandler"
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

            // TODO not sure if I need last part or not. Is it worthwhile if user doesn't have the data yet?
            this.selected = null;
            this.whiteboardViews = {};
            this.jsonWhiteboardList = {'whiteboardCollection': this.collection.toJSON()};
            //this.collection.each(this.added, this);

            this.collection.bind("reset", this.render, this);
            this.collection.bind("add", this.added, this);
            this.collection.bind("remove", this.removed, this);
        },

        /**
         * Render element to screen
         */
        render: function() {
            console.log('render() called');
            this.$el.html(this.template(this.jsonWhiteboardList));
            this.whiteboardContainer = this.$('#whiteboard-container'); // can't do this in initialize b/c the DOM element won't exist yet
            this.drawSelectedWhiteboard();
            return this;
        },

        /**
         * This method is responsible for updating the list of whiteboards and
         * creating a new view for each whiteboard when it is created.
         * @param model
         */
        added: function(model) {

            // create new whiteboard view
            var view = new ChatWhiteboardView();
            this.whiteboardViews[model.id] = view;
            console.log('added() called');
            console.log(view.render().el);
            console.log(this.whiteboardContainer);
            //view.$el.toggle(false);
            this.whiteboardContainer.append(view.render().el);

            // refresh our json list of whiteboards in our collection and render the UI
            this.jsonWhiteboardList = {'whiteboardCollection': this.collection.toJSON()};
            //this.render(); //TODO left off here -- problem was calling render twice.

            // TODO switch to new whiteboard if user added it
            //console.log('myWhiteboard: ' + parseInt(model.myWhiteboard));
            //this.selected = this.$el.find('#select-whiteboard').val();
        },

        /**
         * This method is responsible for updating the list of whiteboards and
         * deleting the whiteboard's view object.
         * @param model
         */
        removed: function(model) {
            console.log('removed() called');
            // TODO define what happens when user deletes a whiteboard. Can user only delete the selected whiteboard? What happens after the delete? Which WB is shown?
            this.whiteboardContainer.children().toggle(false);
            this.jsonWhiteboardList = {'whiteboardCollection': this.collection.toJSON()};
            delete this.whiteboardViews[model.id];
            this.render();
        },

        /**
         * Responsible for showing/hiding the appropriate whiteboard
         * when the user's WB selection changes.
         */
        drawSelectedWhiteboard: function(){
            /*
            this.selected = this.$el.find('#select-whiteboard').val();
            console.log('currently selected whiteboard id: ' + this.selected);
            this.whiteboardContainer.children().toggle(false);
            if (null != this.selected){
                console.log('current whiteboardViews state: ');
                console.log(this.whiteboardViews);
                var view = this.whiteboardViews[this.selected];
                console.log('whiteboard view to be drawn: ');
                console.log(view);
                view.$el.toggle(true);
            }
            */
        },


        /**
         * This function listens to the create-whiteboard modal dialog's
         * success button.
         */
        addWhiteboardButtonHandler: function() {

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
                console.log('Creating whiteboard: ' + wbName);
                var whiteboard = new whiteboardModels.Whiteboard({
                    name: wbName
                });
                whiteboard.save();
            }

            // hide modal dialog when done
            this.$el.find('#create-whiteboard-modal').modal('hide');
        },

        /**
         * This function listens to the 'delete-whiteboard' button.
         */
        deleteWhiteboardButtonHandler: function() {
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
