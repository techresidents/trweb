define([
    'Underscore',
    'core/command',
    'chat/whiteboard/models',
    'chat/whiteboard/proxies',
], function(
    _,
    command,
    whiteboard_models,
    whiteboard_proxies) {

    // TODO convert to async commands
    var CreateWhiteboardCommand = command.Command.extend({
        execute: function(options) {

            var MAX_WHITEBOARDS = 10;

            var ret = false;
            var whiteboardCollectionProxy = this.facade.getProxy(whiteboard_proxies.ChatWhiteboardsProxy.NAME);

            // validate the input whiteboard name
            var whiteboardName = options.name;
            if (whiteboardName == null ||
                whiteboardName == ''   ||
                whiteboardName.length == 0) {
                    whiteboardName = 'Whiteboard #' + parseInt(whiteboardCollectionProxy.collection.length + 1);
            }

            // create a new whiteboard
            if (whiteboardCollectionProxy.collection.length < MAX_WHITEBOARDS){
                var whiteboard = new whiteboard_models.Whiteboard({
                    name: whiteboardName
                });
                whiteboard.save();
                ret = true;
            }

            // TODO Handle returning false if MAX_WHITEBOARDS has been reached.
            return ret;
        }
    });

    var DeleteWhiteboardCommand = command.Command.extend({
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
                        if (whiteboard.name() != DEFAULT_WHITEBOARD_NAME){
                            whiteboard.destroy();
                            ret = true;
                            // TODO I suspect that the whiteboard is not getting deleted in the other particpant's view.  I don't see a DeleteWhiteboardMessage ever being created and sent.
                        }
                    }
                }
            }

            // TODO handle when false is returned in the mediator
            return ret;
        }
    });

    // TODO This command hasn't been setup throughout the rest of the architecture.
    var ClearWhiteboardCommand = command.Command.extend({

        execute: function(options) {

            var ret = false;

            if (options.whiteboardId) {
                var whiteboardPath = new whiteboard_models.WhiteboardPath({
                    whiteboardId : options.whiteboardId,
                    pathId : 'reset'
                });
                // send message to server
                whiteboardPath.destroy();
                ret = true;
            }

            // TODO handle when false is returned in the mediator
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

                whiteboardPath.save(null, {
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

            // Delete the whiteboard path
            if (options.whiteboardId && options.pathId){

                var whiteboardCollectionProxy = this.facade.getProxy(whiteboard_proxies.ChatWhiteboardsProxy.NAME);
                var whiteboard = whiteboardCollectionProxy.collection.get(options.whiteboardId);
                if (whiteboard){

                    // the whiteboard path model and the corresponding element share the same ID
                    var whiteboardPathModel = whiteboard.paths().get(options.pathId);
                    if (whiteboardPathModel){
                        whiteboardPathModel.destroy(null, {
                            success: _.bind(this.onSuccess, this),
                            error: _.bind(this.onError, this)
                        });
                    }
                }
            }

            // TODO handle when false is returned in the mediator
            return ret;
        }
    });

    return {
        CreateWhiteboardCommand: CreateWhiteboardCommand,
        DeleteWhiteboardCommand: DeleteWhiteboardCommand,
        CreateWhiteboardPathCommand: CreateWhiteboardPathCommand,
        DeleteWhiteboardPathCommand: DeleteWhiteboardPathCommand,
    };
});
