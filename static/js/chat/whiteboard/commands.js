define([
    'core/command',
    'chat/whiteboard/models',
    'chat/whiteboard/proxies',
], function(
    command,
    whiteboard_models,
    whiteboard_proxies) {
    
    var CreateWhiteboardCommand = command.Command.extend({
        execute: function(options) {
            //TODO - create whiteboard
            return false;
        }
    });

    var DeleteWhiteboardCommand = command.Command.extend({
        execute: function(options) {
            //TODO - delete whiteboard
            return false;
        }
    });

    var CreateWhiteboardPathCommand = command.Command.extend({
        execute: function(options) {
            //TODO - create whiteboard path
            return false;
        }
    });

    var DeleteWhiteboardPathCommand = command.Command.extend({
        execute: function(options) {
            //TODO - delete whiteboard path
            return false;
        }
    });

    return {
        CreateWhiteboardCommand: CreateWhiteboardCommand,
        DeleteWhiteboardCommand: DeleteWhiteboardCommand,
        CreateWhiteboardPathCommand: CreateWhiteboardPathCommand,
        DeleteWhiteboardPathCommand: DeleteWhiteboardPathCommand,
    };
});
