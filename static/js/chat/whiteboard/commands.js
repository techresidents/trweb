define([
    'Underscore',
    'core/command',
    'chat/message/messages',
    'chat/message/models',
    'chat/whiteboard/models',
    'chat/whiteboard/proxies'
], function(
    _,
    command,
    messages,
    message_models,
    whiteboard_models,
    whiteboard_proxies) {


    var CreateWhiteboardCommand = command.AsyncCommand.extend({

        asyncCallbackArgs: ['model', 'response'],

        execute: function(options) {

            var MAX_WHITEBOARDS = 10;

            var ret = false;
            var whiteboardCollectionProxy = this.facade.getProxy(whiteboard_proxies.ChatWhiteboardsProxy.NAME);

            // validate the input whiteboard name
            var whiteboardName = options.name;
            if (!whiteboardName ||
                whiteboardName === ''   ||
                whiteboardName.length === 0)
            {
                // provide a default name if the provided name is invalid
                whiteboardName = 'Whiteboard #' + parseInt(whiteboardCollectionProxy.collection.length + 1, 10);
            }

            // create a new whiteboard
            if (whiteboardCollectionProxy.collection.length < MAX_WHITEBOARDS){

                var whiteboard = new whiteboard_models.Whiteboard({
                    name: whiteboardName
                });

                var message = new message_models.ChatMessage({
                    header: new messages.MessageHeader(),
                    msg: new messages.WhiteboardCreateMessage(whiteboard.attributes)
                });

                message.save(null, {
                    success: _.bind(this.onSuccess, this),
                    error: _.bind(this.onError, this)
                });

                ret = true;
            }

            return ret;
        }
    });

    var DeleteWhiteboardCommand = command.AsyncCommand.extend({

        asyncCallbackArgs: ['model', 'response'],

        execute: function(options) {

            var MIN_WHITEBOARDS = 1;
            var DEFAULT_WHITEBOARD_NAME = 'Default Whiteboard';

            var ret = false;
            var whiteboardCollectionProxy = this.facade.getProxy(whiteboard_proxies.ChatWhiteboardsProxy.NAME);

            // Delete the whiteboard
            if (whiteboardCollectionProxy.collection.length > MIN_WHITEBOARDS) {

                if (options.whiteboardId){

                    var whiteboard = whiteboardCollectionProxy.collection.get(options.whiteboardId);
                    if (whiteboard){

                        // Don't allow users to delete the default whiteboard
                        if (whiteboard.name() !== DEFAULT_WHITEBOARD_NAME) {

                            var message = new message_models.ChatMessage({
                                header: new messages.MessageHeader(),
                                msg: new messages.WhiteboardDeleteMessage(whiteboard.attributes)
                            });

                            message.save(null, {
                                success: _.bind(this.onSuccess, this),
                                error: _.bind(this.onError, this)
                            });

                            ret = true;
                        }
                    }
                }
            }

            return ret;
        }
    });

    // TODO Setup throughout the rest of the architecture.
    var ClearWhiteboardCommand = command.AsyncCommand.extend({

        execute: function(options) {

            var ret = false;

            if (options.whiteboardId) {
                var whiteboardPath = new whiteboard_models.WhiteboardPath({
                    whiteboardId : options.whiteboardId,
                    pathId : 'reset'
                });

                var message = new message_models.ChatMessage({
                    header: new messages.MessageHeader(),
                    msg: new messages.WhiteboardDeletePathMessage(whiteboardPath.attributes)
                });


                message.save(null, {
                    success: _.bind(this.onSuccess, this),
                    error: _.bind(this.onError, this)
                });

                ret = true;
            }

            return ret;
        }
    });

    var CreateWhiteboardPathCommand = command.AsyncCommand.extend({

        asyncCallbackArgs: ['model', 'response'],

        execute: function(options) {

            var ret = false;

            if (options.whiteboardId && options.serializedPathData) {

                // create path message and send via save()
                var whiteboardPath = new whiteboard_models.WhiteboardPath({
                    whiteboardId : options.whiteboardId,
                    pathData : options.serializedPathData
                });

                var message = new message_models.ChatMessage({
                    header: new messages.MessageHeader(),
                    msg: new messages.WhiteboardCreatePathMessage(whiteboardPath.attributes)
                });

                message.save(null, {
                    success: _.bind(this.onSuccess, this),
                    error: _.bind(this.onError, this)
                });
            }

            return ret;
        }
    });

    var DeleteWhiteboardPathCommand = command.AsyncCommand.extend({

        asyncCallbackArgs: ['model', 'response'],

        execute: function(options) {
            var ret = false;
            var message;

            // Delete the whiteboard path
            if (options.whiteboardId && options.pathId){

                // TODO temporary if-block to handle whiteboard clearing. This should be moved into the ClearWhiteboardCommand.
                if ('reset' === options.pathId) {

                    var whiteboardPath = new whiteboard_models.WhiteboardPath({
                        whiteboardId : options.whiteboardId,
                        pathId : 'reset'
                    });

                    message = new message_models.ChatMessage({
                        header: new messages.MessageHeader(),
                        msg: new messages.WhiteboardDeletePathMessage(whiteboardPath.attributes)
                    });

                    message.save(null, {
                        success: _.bind(this.onSuccess, this),
                        error: _.bind(this.onError, this)
                    });

                    ret = true;
                }
                else {
                    var whiteboardCollectionProxy = this.facade.getProxy(whiteboard_proxies.ChatWhiteboardsProxy.NAME);
                    var whiteboard = whiteboardCollectionProxy.collection.get(options.whiteboardId);

                    if (whiteboard){

                        // the whiteboard path model and the corresponding element share the same ID
                        var whiteboardPathModel = whiteboard.paths().get(options.pathId);
                        if (whiteboardPathModel){

                            message = new message_models.ChatMessage({
                                header: new messages.MessageHeader(),
                                msg: new messages.WhiteboardDeletePathMessage(whiteboardPathModel.attributes)
                            });

                            message.save(null, {
                                success: _.bind(this.onSuccess, this),
                                error: _.bind(this.onError, this)
                            });

                            ret = true;
                        }
                    }
                }
            }

            return ret;
        }
    });

    return {
        CreateWhiteboardCommand: CreateWhiteboardCommand,
        DeleteWhiteboardCommand: DeleteWhiteboardCommand,
        CreateWhiteboardPathCommand: CreateWhiteboardPathCommand,
        DeleteWhiteboardPathCommand: DeleteWhiteboardPathCommand
    };
});
