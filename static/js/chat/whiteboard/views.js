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
     * Whiteboard view.
     * This view extends the whiteboard base view
     * with behavior that the chat whiteboard needs.
     * @constructor
     */
    var ChatWhiteboardView = whiteboard_views.WhiteboardView.extend({

        initialize: function() {

            whiteboard_views.WhiteboardView.prototype.initialize.call(this, this.options);
            this.undoCache = [ ];
            this.serializer = new serialize.Serializer();
            this.whiteboardModel = this.options.model;
            this.viewModel = this.options.viewModel;
            this.pathCollection = this.options.model.paths();

            // init event listeners
            this.pathCollection.bind('reset', this.onWbPathCollectionReset, this);
            this.pathCollection.bind('add', this.onWbPathAdded, this);
            this.pathCollection.bind('destroy', this.onWbPathRemoved, this);

            // setup viewModel listeners
            this.viewModel.on('change:selectedColor', this.onColorChanged, this);
            this.viewModel.on('change:selectedTool', this.onToolChanged, this);
        },


        render: function() {

            // read the view model to determine which color to select
            this.onColorChanged();

            // read the view model to determine which tool to select
            this.onToolChanged();

            return whiteboard_views.WhiteboardView.prototype.render.call(this);
        },


        /**
         * Responsible for handling when the selected whiteboard marker color is changed.
         */
        onColorChanged: function() {

            var colorName = this.viewModel.getSelectedColor();
            var colorHex = null;

            switch(colorName) {
                case whiteboardModels.WhiteboardValueObject.COLORS.BLACK:
                    colorHex = '#000000';
                    break;
                case whiteboardModels.WhiteboardValueObject.COLORS.BLUE:
                    colorHex = '#0000FF';
                    break;
                case whiteboardModels.WhiteboardValueObject.COLORS.GREEN:
                    colorHex = '#00B74A';
                    break;
                case whiteboardModels.WhiteboardValueObject.COLORS.RED:
                    colorHex = '#FF0000';
                    break;
                default:
                    // ignore the change
                    break;
            }

            if (null !== colorHex) {
                this.selectColor(colorHex);
            }
        },


        /**
         * Responsible for handling when the selected whiteboard marker color is changed.
         */
        onToolChanged: function() {

            var tool = null;
            var attributes = {'stroke': this.color};
            var toolName = this.viewModel.getSelectedTool();

            switch(toolName)
            {
                case whiteboardModels.WhiteboardValueObject.TOOLS.PEN:
                    tool = new whiteboard_views.Pen(this.paper, attributes);
                    break;
                case whiteboardModels.WhiteboardValueObject.TOOLS.ARROW:
                    tool = new whiteboard_views.Arrow(this.paper, attributes);
                    break;
                case whiteboardModels.WhiteboardValueObject.TOOLS.RECTANGLE:
                    tool = new whiteboard_views.Rectangle(this.paper, attributes);
                    break;
                case whiteboardModels.WhiteboardValueObject.TOOLS.CIRCLE:
                    tool = new whiteboard_views.Circle(this.paper, attributes);
                    break;
                case whiteboardModels.WhiteboardValueObject.TOOLS.ERASE:
                    tool = new whiteboard_views.Erase(this.paper, null);
                    break;
                default:
                    // NO OP
            }

            if (null !== tool) {
                this.selectTool(tool);
            }
        },



        /**
         * Responsible for handling a whiteboard path collection reset.
         * This method will clear the paper on this event.
         */
        onWbPathCollectionReset: function() {
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
         * instance is successfully created.  This will only be called
         * locally for the user that was responsible for creating the new
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
        }
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
            'click #tools-erase': 'onEraseToolSelected',
            'click #whiteboard-clear-button': 'onClear',
            'click #whiteboard-undo-button': 'onUndo'
        },

        initialize: function() {
            this.template = _.template(whiteboard_tools_template);
            this.viewModel = this.options.viewModel;
        },

        render: function() {
            this.$el.html(this.template());
            this.$('.whiteboard-tool-button').tooltip(); //activate tooltips

            // instantiate and render the color picker view
            new color_views.ColorPickerView({
                el: this.$(this.colorPickerSelector),
                viewModel: this.viewModel
            }).render();

            return this;
        },

        onPenToolSelected: function(){
            this._selectTool(whiteboardModels.WhiteboardValueObject.TOOLS.PEN);
        },

        onArrowToolSelected: function(){
            this._selectTool(whiteboardModels.WhiteboardValueObject.TOOLS.ARROW);
        },

        onRectToolSelected: function(){
            this._selectTool(whiteboardModels.WhiteboardValueObject.TOOLS.RECTANGLE);
        },

        onCircleToolSelected: function(){
            this._selectTool(whiteboardModels.WhiteboardValueObject.TOOLS.CIRCLE);
        },

        onEraseToolSelected: function(){
            this._selectTool(whiteboardModels.WhiteboardValueObject.TOOLS.ERASE);
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
        deleteWhiteboardButtonSelector: '#whiteboard-delete-button',

        events: {
            'change #select-whiteboard': 'onSelectWhiteboard',
            'click #whiteboard-add-button': 'onCreateWhiteboard',
            'click #whiteboard-delete-button': 'onDeleteWhiteboard',
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
            this.viewModel.on('change:selectedWhiteboardId', this.onSelectedWhiteboardChange, this);
        },

        /**
         * Render element to screen
         */
        render: function() {
            this.$el.html(this.template(this.jsonWhiteboardList));

            // ensure the displayed view matches the underlying data model
            this.onSelectedWhiteboardChange();

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
         * This method is invoked when the underlying viewModel data changes.
         * It ensures that this controls view matches the viewModel at all times.
         */
        onSelectedWhiteboardChange: function() {
            this.$(this.whiteboardSelector).val(this.viewModel.getSelectedWhiteboardId());

            // If the default whiteboard is selected, disable the 'delete' button
            // The default whiteboard is the first whiteboard in the whiteboard collection
            var defaultWhiteboard = this.wbCollection.at(0);
            var selectedWhiteboard = this.wbCollection.get(this.viewModel.getSelectedWhiteboardId());
            if (selectedWhiteboard !== null &&
                selectedWhiteboard !== undefined)
            {
                if ( selectedWhiteboard === defaultWhiteboard) {
                    this.$(this.deleteWhiteboardButtonSelector).attr('disabled', 'disabled');
                    this.$(this.deleteWhiteboardButtonSelector).removeClass('btn-danger');
                } else {
                    this.$(this.deleteWhiteboardButtonSelector).removeAttr('disabled');
                    this.$(this.deleteWhiteboardButtonSelector).addClass('btn-danger');
                }
            }
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
        }

    });

    /**
     * Whiteboard tab view.
     * @constructor
     */
    var ChatWhiteboardTabView = core_view.View.extend({

        DEFAULT_WHITEBOARD_NAME: 'Default Whiteboard',

        // Set UI references
        containerSelector: '#whiteboard-container',
        whiteboardRoot: '#whiteboard-wrapper',
        controlsSelector: '#whiteboard-controls',
        toolsSelector: '#whiteboard-tools',


        initialize: function() {
            this.template =  _.template(whiteboard_tab_template);

            // init object to hold all of our whiteboard views
            this.whiteboardViews = {};
            this.rootWhiteboardNode = null;

            // init event listeners
            this.viewModel = this.options.viewModel;
            this.viewModel.on('change:selectedWhiteboardId', this.onWhiteboardSelected, this);

            this.wbCollection = this.options.whiteboards;
            this.wbCollection.bind("reset", this.render, this);
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
                viewModel: this.viewModel
            }).render();

            // instantiate whiteboard container view. This is where the whiteboard will be rendered
            new ChatWhiteboardContainerView({
                el: this.$(this.containerSelector)
            }).render();
            this.rootWhiteboardNode = this.$(this.whiteboardRoot);

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
                    viewModel: this.viewModel,
                    width: 785,       // width of whiteboard. matches well size.
                    paperWidth: 785,  // scrollable width
                    height: 600,      // height of whiteboard
                    paperHeight: 600  // scrollable height
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
                // Hide the whiteboard if it's currently displayed
                if (this.viewModel.getSelectedWhiteboardId() === model.id) {
                    this.rootWhiteboardNode.children().toggle(false);
                }

                // Delete the whiteboard view
                delete this.whiteboardViews[model.id];

                // Select the default whiteboard
                var whiteboards = this.wbCollection.where({'name': this.DEFAULT_WHITEBOARD_NAME});
                if (1 === whiteboards.length) {
                    var defaultWhiteboard = whiteboards[0];
                    if (null !== defaultWhiteboard.id){
                        this.triggerEvent(EVENTS.SELECT_WHITEBOARD, {
                            whiteboardId: defaultWhiteboard.id
                        });
                    }
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
            if (null !== selectedWhiteboardId &&
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
         * Handle when a  whiteboard is cleared.
         * @param event The DOM event
         * @param eventBody
         */
        onClear: function(event, eventBody) {

            if (null !== eventBody.whiteboardId){
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

            if (null !== eventBody.whiteboardId){
                var whiteboardId = eventBody.whiteboardId;
                if (whiteboardId in this.whiteboardViews) {
                    var whiteboardView = this.whiteboardViews[whiteboardId];
                    if (whiteboardView) {
                        whiteboardView.undo();
                    }
                }
            }
        }

    });

    return {
        EVENTS: EVENTS,
        ChatWhiteboardTabView: ChatWhiteboardTabView
    };
});
