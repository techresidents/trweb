define([
    'Underscore',
    'color/views',
    'common/notifications',
    'core/mediator',
    'chat/whiteboard/models',
    'chat/whiteboard/proxies',
    'chat/whiteboard/views',
    'chat/user/proxies',
], function(
    _,
    color_views,
    notifications,
    mediator,
    whiteboard_models,
    whiteboard_proxies,
    whiteboard_views,
    user_proxies) {


    var WhiteboardTabMediator = mediator.Mediator.extend({
        name: function() {
            return WhiteboardTabMediator.NAME;
        },

        // specify which notifications we want to listen to
        notifications: [
            [notifications.WHITEBOARD_ADDED, 'onWhiteboardAdded']
        ],

        initialize: function(options) {

            // setup access to needed data
            this.whiteboardsProxy = this.facade.getProxy(whiteboard_proxies.ChatWhiteboardsProxy.NAME);
            this.usersProxy = this.facade.getProxy(user_proxies.ChatUsersProxy.NAME);

            // initialize the main whiteboard view
            this.view = new whiteboard_views.ChatWhiteboardTabView({
                users: this.usersProxy.collection,
                whiteboards: this.whiteboardsProxy.collection,
                viewModel: new whiteboard_models.WhiteboardValueObject({
                    selectedWhiteboardId: null,
                    selectedTool: whiteboard_models.WhiteboardValueObject.TOOLS.PEN,
                    selectedColor: whiteboard_models.WhiteboardValueObject.COLORS.BLUE
                })
            });

            // setup event listeners
            this.view.addEventListener(color_views.EVENTS.SELECT, this.onMarkerColorSelected, this);
            this.view.addEventListener(whiteboard_views.EVENTS.SELECT_TOOL, this.onToolSelected, this);
            this.view.addEventListener(whiteboard_views.EVENTS.SELECT_WHITEBOARD, this.onWhiteboardSelected, this);

            this.view.addEventListener(whiteboard_views.EVENTS.CREATE_WHITEBOARD, this.onCreateWhiteboard, this);
            this.view.addEventListener(whiteboard_views.EVENTS.DELETE_WHITEBOARD, this.onDeleteWhiteboard, this);
            this.view.addEventListener(whiteboard_views.EVENTS.CLEAR_WHITEBOARD, this.onClearWhiteboard, this);

            this.view.addEventListener(whiteboard_views.EVENTS.CREATE_WHITEBOARD_PATH, this.onCreateWhiteboardPath, this);
            this.view.addEventListener(whiteboard_views.EVENTS.DELETE_WHITEBOARD_PATH, this.onDeleteWhiteboardPath, this);


            /*
                TODO Discuss this comment in the context of the new architecture.

               Create a whiteboard if one doesn't already exist.
               Note that this block of code could be invoked even
               if the collection is not empty due to the delay in
               receiving the chat data from the long poll.  For this
               reason, the WhiteboardCollection will not add models
               to the collection that have a duplicate name; thus, in
               this case, a duplicate default whiteboard will not be added.
             */
            if (this.whiteboardsProxy.collection.length < 1) {
                this.onCreateWhiteboard(whiteboard_views.EVENTS.CREATE_WHITEBOARD, {
                    name: 'Default Whiteboard'
                });
            }

            // send out notification that view has been created
            this.facade.trigger(notifications.VIEW_CREATED, {
                type: 'WhiteboardTabView',
                view: this.view
            });
        },

        /**
         * This function listens for a notification when a whiteboard
         * has finished being added to the whiteboard collection.
         *
         * @param notificationBody Expecting the attributes 'collection' and 'model' to be provided
         */
        onWhiteboardAdded: function(notificationBody) {
            // This will ensure that a whiteboard will always be displayed
            if (this.view.viewModel.getSelectedWhiteboardId() == null) {
                this.view.viewModel.setSelectedWhiteboard(notificationBody.model.id);
            }
        },

        /**
         * Handle when user selects a new marker color
         * to draw on the whiteboard.
         * @param event The DOM event
         * @param eventBody Expecting the attribute 'color' to be specified
         */
        onMarkerColorSelected: function(event, eventBody) {
            this.view.viewModel.setSelectedColor(eventBody.color);
        },

        /**
         * Handle when user selects a new tool
         * to draw on the whiteboard.
         * @param event The DOM event
         * @param eventBody Expecting the attribute 'toolName' to be specified
         */
        onToolSelected: function(event, eventBody) {
            this.view.viewModel.setSelectedTool(eventBody.toolName);
        },

        /**
         * Handle when user selects a whiteboard.
         * @param event The DOM event
         * @param eventBody Expecting the attribute 'whiteboardId' to be specified
         */
        onWhiteboardSelected: function(event, eventBody) {
            this.view.viewModel.setSelectedWhiteboard(eventBody.whiteboardId);
        },

        /**
         * Handle an event to create a new whiteboard
         * @param event The DOM event
         * @param eventBody Expecting the attribute 'name' to be specified
         */
        onCreateWhiteboard: function(event, eventBody) {
            this.facade.trigger(notifications.WHITEBOARD_CREATE, {
                name: eventBody.name
            });
        },

        /**
         * Handle an event to delete a whiteboard from the whiteboard collection.
         * @param event The DOM event
         * @param eventBody Expecting the attribute 'whiteboardId' to be specified
         */
        onDeleteWhiteboard: function(event, eventBody) {
            this.facade.trigger(notifications.WHITEBOARD_DELETE, {
                whiteboardId: eventBody.whiteboardId
            });

        },

        /**
         * Handle an event to clear the whiteboard.
         * Trigger a notification to clear the specified whiteboard.
         * @param event The DOM event
         * @param eventBody Expecting the attribute 'whiteboardId' and 'pathId' to be specified
         */
        // TODO add clear functionality to architecture
        onClearWhiteboard: function(event, eventBody) {
            if (eventBody.whiteboardId) {
                this.facade.trigger(notifications.WHITEBOARD_PATH_CREATE, {
                    whiteboardId: eventBody.whiteboardId,
                    pathId: eventBody.pathId
                });
            }
        },

        /**
         * Handle an event to add a new whiteboard path.
         * @param event The DOM event
         * @param eventBody Expecting the attributes:
         *        'whiteboardId': the whiteboardID that the element was added to,
         *        'serializedPathData': the serialized element,
         *        'onSuccess': callback to invoke upon successful creation of WhiteboardPath model
         *                     which represents the newly drawn element.
         *        'context': the context for the success callback to run in
         *        'elementId': the newly drawn element's ID,
         */
        onCreateWhiteboardPath: function(event, eventBody) {
            this.facade.trigger(notifications.WHITEBOARD_PATH_CREATE, {
                whiteboardId: eventBody.whiteboardId,
                serializedPathData: eventBody.serializedPathData,
                onSuccess: function(options, ret) {
                    eventBody.onSuccess.call(
                        eventBody.context,
                        eventBody.elementId,
                        ret.result.model.msg().pathId);
                }
            });

        },


        /**
         * Handle an event to delete a whiteboard path.
         * @param event The DOM event
         * @param eventBody Expecting the attributes 'whiteboardId' and 'pathId' to be specified
         */
        onDeleteWhiteboardPath: function(event, eventBody) {
            this.facade.trigger(notifications.WHITEBOARD_PATH_DELETE, {
                whiteboardId: eventBody.whiteboardId,
                pathId: eventBody.pathId
            });

        },


    }, {

        NAME: 'WhiteboardTabMediator',
    });

    return {
        WhiteboardTabMediator: WhiteboardTabMediator,
    }
});
