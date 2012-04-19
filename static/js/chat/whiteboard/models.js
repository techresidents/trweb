define([
    'jQuery',
    'Underscore',
    'Backbone',
    'xd/xd',
    'xd/backbone',
    'chat/message/messages',
    'chat/user/models',
], function($, _, Backbone, xd, xdBackbone, messages, user) {
    
    var Whiteboard = Backbone.Model.extend({
            
            idAttribute: "whiteboardId",

            defaults: function() {
                return {
                    whiteboardId: null,
                    userId: null,
                    name: "",
                };
            },
            
            initialize: function(attributes, options) {
                var optionsProvided = false;

                if(options) {
                    this.header = options.header;
                    this.msg = options.msg;
                    optionsProvided = true;
                } else {
                    this.header = new messages.MessageHeader;
                    this.msg = new messages.WhiteboardCreateMessage;
                }

                if(optionsProvided) {
                    this.set({
                        whiteboardId: this.msg.whiteboardId,
                        userId: this.header.userId,
                        name: this.msg.name,
                    });
                }
            },

            urlRoot: function() {
                return this.header.url() + this.msg.url();
            },

            sync: xdBackbone.sync,

            parse: function(response) {
                this.header = response.header;
                this.msg = response.msg;

                return {
                    whiteboardId: response.msg.whiteboardId,
                    userId: response.header.userId,
                    name: response.msg.name,
                };
            },

            toJSON: function() {
                return _.extend(this.attributes, {
                    myWhiteboard: this.get("userId") === user.currentUser.id
                });
            }
    });

    var WhiteboardCollection = Backbone.Collection.extend({

            model: Whiteboard,
            
            sync: xdBackbone.sync,
    });

    return {
        Whiteboard: Whiteboard,
        whiteboardCollection: new WhiteboardCollection,
    };
});
