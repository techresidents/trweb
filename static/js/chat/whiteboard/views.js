define([
    'jQuery',
    'Underscore',
    'Backbone',
    'whiteboard/views',
    'chat/whiteboard/models',
    'whiteboard/serialize',
], function($, _, Backbone, whiteboardViews, whiteboardModels, serialize) {


    /**
     * Mediator.
     * Responsible for coordinating and composing views together.
     */
    var ChatWhiteboardMediatorView = Backbone.View.extend({

        events: {
            'change #select-whiteboard': "showSelectedWhiteboard",
            'click #whiteboard-clear-button': 'clearButtonSelected',
            'click #whiteboard-undo-button': 'undoButtonSelected',
            'click #tools-pen': 'penToolSelected',
            'click #tools-arrow': 'arrowToolSelected',
            'click #tools-rect': 'rectToolSelected',
            'click #tools-circle': 'circleToolSelected',
            'click #tools-text': 'textToolSelected',
            'click #tools-erase': 'eraseToolSelected',
        },

        initialize: function() {
            this.setElement($("#whiteboard"));
            this.rootWhiteboardNode = null;
            this.whiteboardViews = {};
            this.collection.bind("reset", this.render, this);
            this.collection.bind("add", this.addCollectionListener, this);
            this.collection.bind("remove", this.removeCollectionListener, this);
        },

        render: function() {

            // instantiate whiteboard tools view
            new ChatWhiteboardToolsView().render();

            // instantiate controls view
            new ChatWhiteboardControlsView({
                collection: whiteboardModels.whiteboardCollection
            }).render();

            // instantiate whiteboard container view. This is where the whiteboard will be rendered
            new ChatWhiteboardContainerView().render();
            this.rootWhiteboardNode = this.$('#whiteboard-wrapper');
        },

        /**
         * This method is responsible for creating a new view for
         * each whiteboard when it is created.
         * @param model
         */
        addCollectionListener: function(model) {

            // create new whiteboard view
            var view = new ChatWhiteboardView({
                model : model
            });
            this.whiteboardViews[model.id] = view;

            // add new whiteboard view to DOM
            view.$el.toggle(false);
            this.rootWhiteboardNode.append(view.render().el);

            // if no whiteboard is being shown, then show the newly created whiteboard
            if (this.$('#whiteboard-wrapper:first-child').is(':hidden')){
                console.log('div is hidden, displaying the newly added whiteboard');
                view.$el.toggle(true);
            }

            // TODO switch to new whiteboard if user added it
            //console.log('myWhiteboard: ' + parseInt(model.myWhiteboard));
            //this.selected = this.$el.find('#select-whiteboard').val();
        },

        /**
         * This method is responsible for deleting the whiteboard's view object.
         * @param model
         */
        removeCollectionListener: function(model) {
            // TODO define what happens when user deletes a whiteboard. Can user only delete the selected whiteboard? What happens after the delete? Which WB is shown?

            if (model.id in this.whiteboardViews)
            {
                // Hide and delete the currently selected whiteboard
                this.rootWhiteboardNode.children().toggle(false);
                delete this.whiteboardViews[model.id];

                // Select the default whiteboard
                var whiteboards = this.collection.where({'name': 'Default Whiteboard'});
                if (1 == whiteboards.length) {
                    var defaultWhiteboard = whiteboards[0];
                    if (null != defaultWhiteboard.id){
                        this.$el.find('#select-whiteboard').val(defaultWhiteboard.id);
                        this.$el.find('#select-whiteboard').trigger('change');
                    }
                }
            }

        },

        /**
         * Responsible for showing/hiding the appropriate whiteboard
         * when the user's WB selection changes.
         */
        showSelectedWhiteboard: function(){

            // determine which whiteboard is selected
            var selectedWhiteboardId = this.$el.find('#select-whiteboard').val();

            // show the newly selected whitebaord
            if (null != selectedWhiteboardId &&
                selectedWhiteboardId in this.whiteboardViews)
            {
                // hide the previous whiteboard view
                this.rootWhiteboardNode.children().toggle(false);

                // show the newly selected whiteboard view
                var view = this.whiteboardViews[selectedWhiteboardId];
                view.$el.toggle(true);
            }
        },



        clearButtonSelected: function(){
            var selectedWhiteboardId = this.$el.find('#select-whiteboard').val();
            if (null != selectedWhiteboardId &&
                selectedWhiteboardId in this.whiteboardViews)
            {
                var whiteboardView = this.whiteboardViews[selectedWhiteboardId];
                whiteboardView.clear();
            }
        },

        undoButtonSelected: function(){
            var selectedWhiteboardId = this.$el.find('#select-whiteboard').val();
            if (null != selectedWhiteboardId &&
                selectedWhiteboardId in this.whiteboardViews)
            {
                var whiteboardView = this.whiteboardViews[selectedWhiteboardId];
                whiteboardView.undo();
            }
        },

        penToolSelected: function(){
            this.selectTool('Pen');
        },

        arrowToolSelected: function(){
            this.selectTool('Arrow');
        },

        rectToolSelected: function(){
            this.selectTool('Rect');
        },

        circleToolSelected: function(){
            this.selectTool('Circle');
        },

        textToolSelected: function(){
            this.selectTool('Text');
        },

        eraseToolSelected: function(){
            this.selectTool('Erase');
        },

        selectTool: function(toolName){

            // determine which whiteboard is currently selected
            var selectedWhiteboardId = this.$el.find('#select-whiteboard').val();

            // select the pen tool for this whiteboard
            if (null != selectedWhiteboardId &&
                selectedWhiteboardId in this.whiteboardViews)
            {
                var whiteboardView = this.whiteboardViews[selectedWhiteboardId];
                var tool = null;
                switch(toolName)
                {
                    case 'Pen':
                        tool = new whiteboardViews.Pen(whiteboardView.paper);
                        break;
                    case 'Arrow':
                        tool = new whiteboardViews.Arrow(whiteboardView.paper);
                        break;
                    case 'Rect':
                        tool = new whiteboardViews.Rectangle(whiteboardView.paper);
                        break;
                    case 'Circle':
                        tool = new whiteboardViews.Circle(whiteboardView.paper);
                        break;
                    case 'Text':
                        tool = new whiteboardViews.Text(whiteboardView.paper);
                        break;
                    case 'Erase':
                        tool = new whiteboardViews.Erase(whiteboardView.paper);
                        break;
                    default:
                        tool = new whiteboardViews.Pen(whiteboardView.paper);
                }

                whiteboardView.selectTool(tool);
            }
        }
    });


    /**
     * Whiteboard view.
     * This view is really just extending the whiteboard base view
     * with behavior.  It specifies what to do when an element is
     * added or removed.
     * @constructor
     */
    var ChatWhiteboardView = whiteboardViews.WhiteboardView.extend({

        initialize: function() {

            whiteboardViews.WhiteboardView.prototype.initialize.call(this);
            this.undoCache = [ ];
            this.serializer = new serialize.Serializer();
            this.whiteboardModel = this.options.model;
            this.pathCollection = this.options.model.paths();

            // bindings
            this.pathCollection.bind('reset', this.resetPathCollectionListener, this);
            this.pathCollection.bind('add', this.addedPathCollectionListener, this);
            this.pathCollection.bind('destroy', this.removedPathCollectionListener, this);
        },


        /**
         * Responsible for receiving message that clears the whiteboard.
         */
        resetPathCollectionListener: function(){
            this.paper.clear();
        },

        /**
         * Responsible for receiving WhiteboardCreatePath messages.
         * This function will deserialze the msg data and draw the
         * path on the user's screen.
         * @param model
         */
        addedPathCollectionListener: function(model) {

            var elementToAdd = this.serializer.deserializeElement(model.pathData());
            if (elementToAdd){
                // check if this element already exists on the paper (meaning this user added this element to the paper)
                var elementExists = this.paper.getById(model.id);
                if (elementExists){
                    // No-op. No need to add this element to the paper again.
                } else {

                    // add element to the paper
                    var addedElements = this.paper.add(elementToAdd);

                    /* After drawing the element, assign the element an ID so that we can use
                     paper.getById() at a later point in time to delete or perform some other
                     action on this element.
                     */
                    // TODO The elements var can contain multiple elements.  The assumption is that currently the createWhiteboardMessages will only contain one element.
                    if (addedElements.length > 0) {
                        addedElements[0].id = model.id;
                    }
                }
            }
        },

        /**
         * Responsible for receiving WhiteboardDeletePath messages.
         * This function will remove the specified path on the user's screen.
         * @param model
         */
        removedPathCollectionListener: function(model) {

            var element = this.paper.getById(model.id);
            if (element) {
                element.remove();
            }
        },

        /**
         * @Override
         * This method will capture data the user draws on their whiteboard,
         * serialize the data and send out a message for the other chat participants
         * to receive.
         * @param tool
         * @param element
         */
        onElementAdded: function(tool, element) {

            // call super
            whiteboardViews.WhiteboardView.prototype.onElementAdded.call(this, tool, element);

            // create path message and send via save()
            var whiteboardPath = new whiteboardModels.WhiteboardPath({
                whiteboardId : this.whiteboardModel.id,
                pathData : this.serializer.serializeElement(element)
            });

            var that = this;
            whiteboardPath.save(null, {success: function(model, response){

                var newlyDrawnElement = that.paper.getById(element.id);
                if (newlyDrawnElement) {

                    // assign the model's ID to the element
                    newlyDrawnElement.id = model.id;

                    // cache elements user added to the paper
                    that.undoCache.push(model.id);
                }
            }});
        },


        /**
         * @Override
         * This method will capture data the user removed from their whiteboard,
         * serialize the data and send out a message for the other chat participants
         * to receive.
         * @param tool
         * @param element
         */
        onElementRemoved: function(element) {

            // call super
            whiteboardViews.WhiteboardView.prototype.onElementRemoved.call(this, element);

            // the model and the element share the same ID
            var whiteboardPathModel = this.pathCollection.get(element.id);
            if (whiteboardPathModel){
                whiteboardPathModel.destroy();
            }
        },

        /**
         * @Override
         * This method captures when a user clears the whiteboard, and
         * sends a message to the other chat participants to do the same.
         */
        onBoardCleared: function() {

            // call super
            whiteboardViews.WhiteboardView.prototype.onBoardCleared.call(this);

            // create path message with unique pathID to indicate a board-clear operation
            var whiteboardPath = new whiteboardModels.WhiteboardPath({
                whiteboardId : this.whiteboardModel.id,
                pathId : 'reset'
            });
            // send message to server
            whiteboardPath.destroy();
        },


        // I think there will a problem with this feature however since the path
        // is being written twice with two different IDs by the user who drew the element.
        // Delete seems to be broken; in the process of debugging this in the dispatch view.
        undo: function() {
            if (this.undoCache.length > 0) {
                var wbPathModelId = this.undoCache.pop();
                if (wbPathModelId) {
                    var wbPathModel = this.pathCollection.get(wbPathModelId);
                    if (wbPathModel){
                        wbPathModel.destroy();
                    }
                }
            }
        }

    });

    /**
     * Whiteboard container layout.
     * @constructor
     */
    var ChatWhiteboardContainerView = Backbone.View.extend({

        templateSelector: '#whiteboard-container-template',

        initialize: function() {
            this.setElement($('#whiteboard-containerZ'));
            this.template = _.template($(this.templateSelector).html());
        },

        render: function() {
            this.$el.html(this.template());
            return this;
        },

    });

    /**
     * Whiteboard Tools View.
     * This View is responsible for displaying the list
     * of tools available for the user to use on the
     * whiteboard.
     */
    var ChatWhiteboardToolsView = Backbone.View.extend({

        templateSelector: '#whiteboard-tools-template',

        initialize: function() {
            this.setElement($("#whiteboard-tools"));
            this.template = _.template($(this.templateSelector).html());
        },

        render: function() {
            this.$el.html(this.template());
            return this;
        },
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
            this.jsonWhiteboardList = {'whiteboardCollection': this.collection.toJSON()};
            //this.collection.each(this.added, this);

            this.collection.bind("reset", this.render, this);
            this.collection.bind("add", this.addCollectionListener, this);
            this.collection.bind("remove", this.removeCollectionListener, this);
        },

        /**
         * Render element to screen
         */
        render: function() {
            this.$el.html(this.template(this.jsonWhiteboardList));
            return this;
        },

        /**
         * This method is responsible for updating the list of whiteboards.
         * @param model
         */
        addCollectionListener: function(model) {
            this.jsonWhiteboardList = {'whiteboardCollection': this.collection.toJSON()};
            this.render();
        },

        /**
         * This method is responsible for updating the list of whiteboards
         * @param model
         */
        removeCollectionListener: function(model) {
            this.jsonWhiteboardList = {'whiteboardCollection': this.collection.toJSON()};
            this.render();
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

                    // TODO I suspect that the whiteboard is not getting deleted in the other particpant's view.
                    // I don't see a DeleteWhiteboardMessage ever being created and sent.
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
            new ChatWhiteboardMediatorView({
                collection: whiteboardModels.whiteboardCollection
            }).render();
        }
    });

    return {
        ChatWhiteboardTabView: ChatWhiteboardTabView
    }
});
