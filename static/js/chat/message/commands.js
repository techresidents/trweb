define([
    'core/command',
    'chat/marker/proxies',
    'chat/minute/models',
    'chat/minute/proxies',
    'chat/tag/models',
    'chat/tag/proxies',
    'chat/whiteboard/models',
    'chat/whiteboard/proxies',
], function(
    command,
    marker_proxies,
    minute_models,
    minute_proxies,
    tag_models,
    tag_proxies,
    whiteboard_models,
    whiteboard_proxies) {

    var MarkerCreateMessageCommand = command.Command.extend({
        execute: function(options) {
            var proxy = this.facade.getProxy(marker_proxies.ChatMarkersProxy.NAME);
            var model = options.model;
            var marker = new proxy.collection.model(null, {
                header: model.header(),
                msg: model.msg()
            });

            return true;
        }
    });
    
    var MinuteCreateMessageCommand = command.Command.extend({
        execute: function(options) {
            var proxy = this.facade.getProxy(minute_proxies.ChatMinutesProxy.NAME);
            var model = options.model;
            var minute = new minute_models.Minute(null, {
                header: model.header(),
                msg: model.msg()
            });
            proxy.add(minute);

            return true;
        }
    });

    var MinuteUpdateMessageCommand = command.Command.extend({
        execute: function(options) {
            var proxy = this.facade.getProxy(minute_proxies.ChatMinutesProxy.NAME);
            var model = options.model;
            var minute = proxy.get(model.get('msg').minuteId);
            minute.reinitialize(null, {
                header: model.header(),
                msg: model.msg()
            });

            return true;
        }
    });

    var TagCreateMessageCommand = command.Command.extend({
        execute: function(options) {
            var proxy = this.facade.getProxy(tag_proxies.ChatTagsProxy.NAME);
            var model = options.model;
            var tag = new tag_models.Tag(null, {
                header: model.header(),
                msg: model.msg()
            });
            proxy.add(tag);

            return true;
        }
    });

    var TagDeleteMessageCommand = command.Command.extend({
        execute: function(options) {
            var proxy = this.facade.getProxy(tag_proxies.ChatTagsProxy.NAME);
            var model = options.model;
            var tag = proxy.get(model.get('msg').tagId);
            if(tag) {
                tag.trigger('destroy', tag);
            }

            return true;
        }
    });

    var WhiteboardCreateMessageCommand = command.Command.extend({
        execute: function(options) {
            var proxy = this.facade.getProxy(whiteboard_proxies.ChatWhiteboardsProxy.NAME);
            var model = options.model;
            var whiteboard = new whiteboard_models.Whiteboard(null, {
                header: model.header(),
                msg: model.msg()
            });
            proxy.add(whiteboard);

            return true;
        }
    });

    var WhiteboardDeleteMessageCommand = command.Command.extend({
        execute: function(options) {
            var proxy = this.facade.getProxy(whiteboard_proxies.ChatWhiteboardsProxy.NAME);
            var model = options.model;
            var whiteboard = proxy.get(model.get('msg').whiteboardId);
            if(whiteboard) {
                whiteboard.trigger('destroy', whiteboard);
            }

            return true;
        }
    });

    var WhiteboardCreatePathMessageCommand = command.Command.extend({
        execute: function(options) {
            var proxy = this.facade.getProxy(whiteboard_proxies.ChatWhiteboardsProxy.NAME);
            var model = options.model;
            var whiteboardPath = new whiteboard_models.WhiteboardPath(null, {
                header: model.header(),
                msg: model.msg()
            });

            var whiteboard = proxy.get(model.get('msg').whiteboardId);
            if(whiteboard) {
                whiteboard.paths().add(whiteboardPath);
            }

            return true;
        }
    });

    var WhiteboardDeletePathMessageCommand = command.Command.extend({
        execute: function(options) {
            var proxy = this.facade.getProxy(whiteboard_proxies.ChatWhiteboardsProxy.NAME);
            var model = options.model;
            var whiteboard = proxy.get(model.get('msg').whiteboardId);
            var pathId = model.get('msg').pathId;

            if ('reset' == pathId){
                // treat a pathId of 'reset' as a trigger to clear the whiteboard
                whiteboard.paths().reset();
            }
            else {
                // delete the specified path
                var whiteboardPath = whiteboard.paths().get(pathId);
                if(whiteboardPath) {
                    whiteboardPath.trigger('destroy', whiteboardPath);
                }
            }

            return true;
        }
    });

    return {
        MarkerCreateMessageCommand: MarkerCreateMessageCommand,
        MinuteCreateMessageCommand: MinuteCreateMessageCommand,
        MinuteUpdateMessageCommand: MinuteUpdateMessageCommand,
        TagCreateMessageCommand: TagCreateMessageCommand,
        TagDeleteMessageCommand: TagDeleteMessageCommand,
        WhiteboardCreateMessageCommand: WhiteboardCreateMessageCommand,
        WhiteboardDeleteMessageCommand: WhiteboardDeleteMessageCommand,
        WhiteboardCreatePathMessageCommand: WhiteboardCreatePathMessageCommand,
        WhiteboardDeletePathMessageCommand: WhiteboardDeletePathMessageCommand,
    };
});
