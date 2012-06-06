define([
    'jQuery',
    'Underscore',
    'Backbone',
    'chat/whiteboard/models',
    'color/views',
    'core/view',
    'whiteboard/serialize',
    'whiteboard/views',
    'text!chat/whiteboard/templates/whiteboard_container.html',
    'text!chat/whiteboard/templates/whiteboard_controls.html',
    'text!chat/whiteboard/templates/whiteboard_mediator.html',
    'text!chat/whiteboard/templates/whiteboard_tab.html',
    'text!chat/whiteboard/templates/whiteboard_text_input.html',
    'text!chat/whiteboard/templates/whiteboard_tools.html'
], function(
    $,
    _,
    Backbone,
    whiteboardModels,
    color_views,
    core_view,
    serialize,
    whiteboard_views,
    whiteboard_container_template,
    whiteboard_controls_template,
    whiteboard_mediator_template,
    whiteboard_tab_template,
    whiteboard_text_input_template,
    whiteboard_tools_template) {


    var EVENTS = {

        CREATE_WHITEBOARD: 'whiteboard:addWhiteboard',
        DELETE_WHITEBOARD: 'whiteboard:deleteWhiteboard',

        CREATE_WHITEBOARD_PATH: 'whiteboard:createWhiteboardPath',
        DELETE_WHITEBOARD_PATH: 'whiteboard:deleteWhiteboardPath',

        SELECT_WHITEBOARD: 'whiteboard:selectWhiteboard',
        CLEAR_WHITEBOARD: 'whiteboard:clearWhiteboard',
        UNDO: 'whiteboard:undo',

        SELECT_TOOL: 'whiteboard:selectTool'

    };

    /**
     * TODO delete
     * Mediator.
     * Responsible for coordinating and composing views together.
     */
    var ChatWhiteboardMediatorView = Backbone.View.extend({
        
        containerSelector: '#whiteboard-container',

        controlsSelector: '#whiteboard-controls',
        
        toolsSelector: '#whiteboard-tools',

        events: {
            'change #select-whiteboard': "showSelectedWhiteboard",
            'click #whiteboard-clear-button': 'clearButtonSelected',
            'click #whiteboard-undo-button': 'undoButtonSelected',
            'click #tools-pen': 'penToolSelected',
            'click #tools-arrow': 'arrowToolSelected',
            'click #tools-rect': 'rectToolSelected',
            'click #tools-circle': 'circleToolSelected',
            'click #tools-text': 'textToolSelected',
            'click #tools-erase': 'eraseToolSelected'
        },

        initialize: function() {
            this.template =  _.template(whiteboard_mediator_template);
            this.rootWhiteboardNode = null;
            this.whiteboardViews = {};
            this.collection.bind("reset", this.render, this);
            this.collection.bind("add", this.addCollectionListener, this);
            this.collection.bind("remove", this.removeCollectionListener, this);


        },

        render: function() {
            this.$el.html(this.template());

            // instantiate whiteboard tools view
            new ChatWhiteboardToolsView({
                el: this.$(this.toolsSelector)
            }).render();

            // instantiate controls view
            new ChatWhiteboardControlsView({
                el: this.$(this.controlsSelector),
                collection: this.collection,
            }).render();

            // instantiate whiteboard container view. This is where the whiteboard will be rendered
            new ChatWhiteboardContainerView({
                el: this.$(this.containerSelector),
            }).render();
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

            // select the tool for this whiteboard
            if (null != selectedWhiteboardId &&
                selectedWhiteboardId in this.whiteboardViews)
            {
                var whiteboardView = this.whiteboardViews[selectedWhiteboardId];
                var attributes = {'stroke': whiteboardView.color};
                var tool = null;
                switch(toolName)
                {
                    case 'Pen':
                        tool = new whiteboard_views.Pen(whiteboardView.paper, attributes);
                        break;
                    case 'Arrow':
                        tool = new whiteboard_views.Arrow(whiteboardView.paper, attributes);
                        break;
                    case 'Rect':
                        tool = new whiteboard_views.Rectangle(whiteboardView.paper, attributes);
                        break;
                    case 'Circle':
                        tool = new whiteboard_views.Circle(whiteboardView.paper, attributes);
                        break;
                    case 'Text':
                        tool = new whiteboard_views.Text(whiteboardView.paper, attributes);
                        break;
                    case 'Erase':
                        tool = new whiteboard_views.Erase(whiteboardView.paper, null);
                        break;
                    default:
                        tool = new whiteboard_views.Pen(whiteboardView.paper, attributes);
                }

                whiteboardView.selectTool(tool);
            }
        },


    });


    /**
     * Whiteboard view.
     * This view extends the whiteboard base view
     * with behavior that the chat whiteboard needs.
     * @constructor
     */
    var ChatWhiteboardView = whiteboard_views.WhiteboardView.extend({

        initialize: function() {

            whiteboard_views.WhiteboardView.prototype.initialize.call(this);
            this.undoCache = [ ];
            this.serializer = new serialize.Serializer();
            this.whiteboardModel = this.options.model;
            this.viewModel = this.options.viewModel;
            this.pathCollection = this.options.model.paths();

            // init event listeners
            this.pathCollection.bind('reset', this.onWbPathCollectionReset, this);
            this.pathCollection.bind('add', this.onWbPathAdded, this);
            this.pathCollection.bind('destroy', this.onWbPathRemoved, this);
        },


        /**
         * Responsible for handling a whiteboard path collection reset.
         * This method will clear the paper on this event.
         */
        onWbPathCollectionReset: function(){
            this.paper.clear();
        },

        /**
         * Responsible for handling when a new whiteboard path is added to the path collection.
         * This function will deserialize the received msg data and draw the
         * path element on the user's screen.
         * @param model WhiteboardPath model
         */
        onWbPathAdded: function(model) {

            var elementToAdd = this.serializer.deserializeElement(model.pathData());
            if (elementToAdd){

                // Check if this element already exists on the paper. If the element already exists,
                // it implies that this user was responsible for adding the element to the paper.
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

                    // The elements var can contain multiple elements.
                    // The assumption is that currently the createWhiteboardMessages will only contain one element.
                    if (addedElements.length > 0) {
                        addedElements[0].id = model.id;
                    }
                }
            }
        },

        /**
         * Responsible for handling when a whiteboard path is removed from the path collection.
         * This function will remove the specified path on the user's screen.
         * @param model WhiteboardPath model
         */
        onWbPathRemoved: function(model) {
            var element = this.paper.getById(model.id);
            if (element) {
                element.remove();
            }
        },

        /**
         * Define a callback to be invoked when a WhiteboardPath
         * instance is successfully created.  This wil only be called
         * locally for the user that was resonsible for creating the new
         * whiteboard path.
         *
         * @param elementId the Raphael element ID that the user created
         * @param modelId the WhiteboardPath model ID which represents the Raphael element
         */
        onSuccessfulPathCreation: function(elementId, modelId) {

            if (modelId) {
                var newlyDrawnElement = this.paper.getById(elementId);
                if (newlyDrawnElement) {

                    // Assign the model's ID to the element.
                    // Doing this will facilitate accessing this element for
                    // further action e.g. delete, move, etc.
                    newlyDrawnElement.id = modelId;

                    // cache elements user added to the paper
                    this.undoCache.push(modelId);
                }
            }
        },

        /**
         * @Override
         * This method will capture elements the user draws on their whiteboard,
         * serialize the data, and send out a message for the other chat participants
         * to receive.
         *
         * @param tool the tool name that was used to create the element
         * @param element the Raphael element that was added to the Raphael paper
         */
        onElementAdded: function(tool, element) {

            // call super
            whiteboard_views.WhiteboardView.prototype.onElementAdded.call(this, tool, element);

            if (element) {

                // trigger whiteboard path create event
                this.triggerEvent(EVENTS.CREATE_WHITEBOARD_PATH, {
                    context: this,
                    whiteboardId: this.viewModel.getSelectedWhiteboardId(),
                    elementId: element.id,
                    serializedPathData: this.serializer.serializeElement(element),
                    onSuccess: this.onSuccessfulPathCreation
                });
            }
        },

        /**
         * @Override
         * This method will capture the element the user removed from their whiteboard,
         * and send out a message for the other chat participants to receive.
         * @param element The Raphael element that was removed from the paper
         */
        onElementRemoved: function(element) {

            // call super
            whiteboard_views.WhiteboardView.prototype.onElementRemoved.call(this, element);

            if (element) {
                // trigger path delete event
                this.triggerEvent(EVENTS.DELETE_WHITEBOARD_PATH, {
                    whiteboardId: this.viewModel.getSelectedWhiteboardId(),
                    pathId: element.id
                });
            }
        },


        /**
         * This method will 'undo' the user's actions on the whiteboard.
         */
        undo: function() {
            if (this.undoCache.length > 0) {
                var wbPathModelId = this.undoCache.pop();
                if (wbPathModelId) {
                    var wbPathModel = this.pathCollection.get(wbPathModelId);
                    if (wbPathModel){
                        this.triggerEvent(EVENTS.DELETE_WHITEBOARD_PATH, {
                            whiteboardId: this.viewModel.getSelectedWhiteboardId(),
                            pathId: wbPathModelId
                        });
                    }
                }
            }
        }

    });

    /**
     * Whiteboard container layout.
     * This is a thin wrapper that will house the whiteboard
     * chat view.
     * @constructor
     */
    var ChatWhiteboardContainerView = core_view.View.extend({

        initialize: function() {
            this.template = _.template(whiteboard_container_template);
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
     * @constructor
     */
    var ChatWhiteboardToolsView = core_view.View.extend({

        colorPickerSelector: '#color-picker-wrapper',

        // Set DOM event listeners
        events: {
            'click #tools-pen':   'onPenToolSelected',
            'click #tools-arrow': 'onArrowToolSelected',
            'click #tools-rect':  'onRectToolSelected',
            'click #tools-circle':'onCircleToolSelected',
            'click #tools-text':  'onTextToolSelected',
            'click #tools-erase': 'onEraseToolSelected'
        },

        initialize: function() {
            this.template = _.template(whiteboard_tools_template);
        },

        render: function() {
            this.$el.html(this.template());
            this.$('.whiteboard-tool-button').tooltip(); //activate tooltips

            // instantiate color picker view
            new color_views.ColorPickerView({
                el: this.$(this.colorPickerSelector)
            }).render();

            return this;
        },

        onPenToolSelected: function(){
            this._selectTool('Pen');
        },

        onArrowToolSelected: function(){
            this._selectTool('Arrow');
        },

        onRectToolSelected: function(){
            this._selectTool('Rect');
        },

        onCircleToolSelected: function(){
            this._selectTool('Circle');
        },

        onTextToolSelected: function(){
            this._selectTool('Text');
        },

        onEraseToolSelected: function(){
            this._selectTool('Erase');
        },

        /**
         * Responsible for selecting the tool
         * that the user has selected.
         * @param toolName
         */
        _selectTool: function(toolName){
            if (toolName) {
                this.triggerEvent(EVENTS.SELECT_TOOL, {toolName:toolName});
            }
        }
    });

    /**
     * Whiteboard controls view.
     * This view will be responsible for displaying the
     * controls responsible for selecting, creating, and deleting
     * whiteboards. This view will remain visible regardless of which specific whiteboard
     * is being viewed.
     * @constructor
     */
    var ChatWhiteboardControlsView = core_view.View.extend({

        whiteboardSelector: '#select-whiteboard',
        whiteboardNameInputSelector: '#whiteboard-name-input',
        createWhiteboardModalSelector: '#create-whiteboard-modal',

        events: {
            'change #select-whiteboard': "onSelectWhiteboard",
            "click #whiteboard-add-button": "onCreateWhiteboard",
            "click #whiteboard-delete-button": "onDeleteWhiteboard",
            'click #whiteboard-clear-button': 'onClear',
            'click #whiteboard-undo-button': 'onUndo'
        },

        initialize: function() {
            this.template = _.template(whiteboard_controls_template);
            this.viewModel = this.options.viewModel;
            this.wbCollection = this.options.wbCollection;
            this.jsonWhiteboardList = {'whiteboardCollection': this.wbCollection.toJSON()};

            // setup whiteboard collection listeners
            this.wbCollection.bind("reset", this.render, this);
            this.wbCollection.bind("add", this.refreshWhiteboardList, this);
            this.wbCollection.bind("remove", this.refreshWhiteboardList, this);

            // setup viewModel listeners
            this.viewModel.on('change:selectedWhiteboardId', this.onWhiteboardSelected, this);
        },

        /**
         * Render element to screen
         */
        render: function() {
            this.$el.html(this.template(this.jsonWhiteboardList));
            this.onWhiteboardSelected();
            return this;
        },

        /**
         * This method is responsible for refreshing the list of whiteboards.
         * @param model
         */
        refreshWhiteboardList: function(model) {
            this.jsonWhiteboardList = {'whiteboardCollection': this.wbCollection.toJSON()};
            this.render();
        },

        /**
         * Handle when a user clicks the whiteboard select drop-down.
         */
        onSelectWhiteboard: function() {
            // determine which whiteboard is selected
            var selectedWhiteboardId = this.$el.find(this.whiteboardSelector).val();
            this.triggerEvent(EVENTS.SELECT_WHITEBOARD, {
                whiteboardId: selectedWhiteboardId
            });
        },

        /**
         * Ensure that this controls view matches the viewModel.
         */
        onWhiteboardSelected: function() {
            this.$(this.whiteboardSelector).val(this.viewModel.getSelectedWhiteboardId());
        },

        /**
         * This function listens to the create-whiteboard modal dialog's
         * success button.
         */
        onCreateWhiteboard: function() {

            // read the input whiteboard name
            var wbNameInput = this.$(this.whiteboardNameInputSelector);
            var wbName = wbNameInput.val();

            this.triggerEvent(EVENTS.CREATE_WHITEBOARD, {
                name: wbName
            });

            // clear the name input field
            wbNameInput.val('');

            // hide modal dialog when done
            this.$el.find(this.createWhiteboardModalSelector).modal('hide');
        },

        /**
         * This function listens to the 'delete-whiteboard' button.
         */
        onDeleteWhiteboard: function() {
            this.triggerEvent(EVENTS.DELETE_WHITEBOARD, {
                whiteboardId: this.viewModel.getSelectedWhiteboardId()
            });
        },

        /**
         * This function listens on the 'clear' button
         */
        onClear: function(){
            this.triggerEvent(EVENTS.CLEAR_WHITEBOARD, {
                whiteboardId: this.viewModel.getSelectedWhiteboardId()
            });
        },

        /**
         * This function listens on the 'undo' button.
         */
        onUndo: function(){
            this.triggerEvent(EVENTS.UNDO, {
                whiteboardId: this.viewModel.getSelectedWhiteboardId()
            });
        },

    });

    /**
     * Whiteboard tab view.
     * @constructor
     */
    var ChatWhiteboardTabView = core_view.View.extend({


        // Set UI references
        containerSelector: '#whiteboard-container',
        controlsSelector: '#whiteboard-controls',
        toolsSelector: '#whiteboard-tools',


        initialize: function() {
            this.template =  _.template(whiteboard_tab_template);

            // init object to hold all of our whiteboard views
            this.whiteboardViews = {};
            this.rootWhiteboardNode = null;

            // init event listeners
            this.viewModel = this.options.viewModel;
            this.viewModel.on('change:selectedColor', this.onColorSelected, this);
            this.viewModel.on('change:selectedWhiteboardId', this.onWhiteboardSelected, this);
            this.viewModel.on('change:selectedTool', this.onToolSelected, this);

            this.wbCollection = this.options.whiteboards;
            //this.wbCollection.bind("reset", this.render, this); TODO
            this.wbCollection.bind("add", this.onWhiteboardAdded, this);
            this.wbCollection.bind("remove", this.onWhiteboardRemoved, this);

            this.addEventListener(EVENTS.CLEAR_WHITEBOARD, this.onClear, this);
            this.addEventListener(EVENTS.UNDO, this.onUndo, this);

        },


        render: function() {
            this.$el.html(this.template());

            // instantiate whiteboard tools view
            new ChatWhiteboardToolsView({
                el: this.$(this.toolsSelector),
            }).render();

            // instantiate controls view
            new ChatWhiteboardControlsView({
                el: this.$(this.controlsSelector),
                wbCollection: this.wbCollection,
                viewModel: this.viewModel
            }).render();

            // instantiate whiteboard container view. This is where the whiteboard will be rendered
            new ChatWhiteboardContainerView({
                el: this.$(this.containerSelector)
            }).render();

            // TODO
            this.rootWhiteboardNode = this.$('#whiteboard-wrapper');

            return this;
        },


        /**
         * This method is responsible for creating a new whiteboard view for
         * each whiteboard when it is created.
         * @param model
         */
        onWhiteboardAdded: function(model) {

            if (model) {

                // create a new whiteboard view
                var view = new ChatWhiteboardView({
                    model : model,
                    viewModel: this.viewModel
                });

                // add the new view to the list of whiteboard views
                this.whiteboardViews[model.id] = view;

                // add new whiteboard view to DOM
                view.$el.toggle(false);
                this.rootWhiteboardNode.append(view.render().el);

            }
        },

        /**
         * This method is responsible for handling when a whiteboard is deleted.
         * It will delete the whiteboard's view object.
         *
         * Users can only delete the displayed whiteboard.
         * After the delete, the default whiteboard will be selected and displayed.
         *
         * @param model  The Whiteboard model that was deleted
         */
        onWhiteboardRemoved: function(model) {

            if (model.id in this.whiteboardViews)
            {
                // Hide and delete the currently selected whiteboard
                this.rootWhiteboardNode.children().toggle(false);
                delete this.whiteboardViews[model.id];

                // Select the default whiteboard
                var whiteboards = this.wbCollection.where({'name': 'Default Whiteboard'});
                if (1 == whiteboards.length) {
                    var defaultWhiteboard = whiteboards[0];
                    if (null != defaultWhiteboard.id){
                        this.triggerEvent(EVENTS.SELECT_WHITEBOARD, {
                            whiteboardId: defaultWhiteboard.id
                        });
                    }
                }
            }
        },

        /**
         * Handle when user changes the whiteboard marker color.
         * The selected marker color will persist across all whiteboards.
         */
        onColorSelected: function(){
            // update the selected color in each whiteboard
            // TODO ensure only the members I want to iterate over are happening
            for(var whiteboardId in this.whiteboardViews){
                var whiteboardView = this.whiteboardViews[whiteboardId];
                if (whiteboardView) {
                    whiteboardView.selectColor(this.viewModel.selectedColor);
                }
            }
        },

        /**
         * Handle when the user changes the whiteboard that they are viewing.
         */
        onWhiteboardSelected: function(){

            // determine which whiteboard is selected
            var selectedWhiteboardId = this.viewModel.getSelectedWhiteboardId();

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

        /**
         * Handle when user changes the whiteboard tool
         * The selected tool will persist across all whiteboards.
         */
        onToolSelected: function(){
            // update the selected tool in each whiteboard
            // TODO ensure only the members I want to iterate over are happening
            for(var whiteboardId in this.whiteboardViews){

                var whiteboardView = this.whiteboardViews[whiteboardId];
                if (whiteboardView) {

                    // TODO come back to this and see if I can simplify how color is handled
                    var attributes = {'stroke': whiteboardView.color};
                    var tool = null;

                    switch(this.viewModel.getSelectedTool())
                    {
                        case 'Pen':
                            tool = new whiteboard_views.Pen(whiteboardView.paper, attributes);
                            break;
                        case 'Arrow':
                            tool = new whiteboard_views.Arrow(whiteboardView.paper, attributes);
                            break;
                        case 'Rect':
                            tool = new whiteboard_views.Rectangle(whiteboardView.paper, attributes);
                            break;
                        case 'Circle':
                            tool = new whiteboard_views.Circle(whiteboardView.paper, attributes);
                            break;
                        case 'Text':
                            tool = new whiteboard_views.Text(whiteboardView.paper, attributes);
                            break;
                        case 'Erase':
                            tool = new whiteboard_views.Erase(whiteboardView.paper, null);
                            break;
                        default:
                            tool = new whiteboard_views.Pen(whiteboardView.paper, attributes);
                    }

                    if (null != tool) {
                        whiteboardView.selectTool(tool);
                    }
                }
            }
        },


        /**
         * Handle when a  whiteboard is cleared.
         * @param event The DOM event
         * @param eventBody
         */
        onClear: function(event, eventBody) {

            if (null != eventBody.whiteboardId){
                var whiteboardId = eventBody.whiteboardId;
                if (whiteboardId in this.whiteboardViews) {
                    var whiteboardView = this.whiteboardViews[whiteboardId];
                    if (whiteboardView) {
                        whiteboardView.clear();
                    }
                }
            }
        },

        /**
         * Handle when a  whiteboard edit is undone
         * @param event The DOM event
         * @param eventBody Expecting the attribute 'whiteboardId' to be provided
         */
        onUndo: function(event, eventBody){

            if (null != eventBody.whiteboardId){
                var whiteboardId = eventBody.whiteboardId;
                if (whiteboardId in this.whiteboardViews) {
                    var whiteboardView = this.whiteboardViews[whiteboardId];
                    if (whiteboardView) {
                        whiteboardView.undo();
                    }
                }
            }
        },



    });

    return {
        EVENTS: EVENTS,
        ChatWhiteboardTabView: ChatWhiteboardTabView
    }
});
