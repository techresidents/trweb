define([
    'jQuery',
    'Underscore',
    'Backbone',
    'xd/xd',
    'xd/backbone',
    'chat/message/messages',
    'chat/user/models',
], function($, _, Backbone, xd, xdBackbone, messages, user) {
 
    /**
     * Whiteboard model.
     */
    var Whiteboard = Backbone.Model.extend({

        idAttribute: 'whiteboardId',

        defaults: function() {
            return {
                whiteboardId: null,
                userId: null,
                name: null,
                paths: new WhiteboardPathCollection(),
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

        // TODO Need getter/setter for whiteboardId? paths?

        userId: function() {
            return this.get('userId');
        },

        setUserId: function(userId) {
            this.set({userId: userId});
            return this;
        },

        name: function() {
            return this.get('name');
        },

        setName: function(name) {
            this.set({name: name});
            return this;
        },

        urlRoot: function() {
            return this.header.url() + this.msg.url();
        },

        /**
         * Cross domain compatible sync.
         */
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
    });

    /**
     * Whiteboard collection.
     */
    var WhiteboardCollection = Backbone.Collection.extend({

        model: Whiteboard,

        /**
         * Override the 'add' method in order to enforce that
         * a whiteboard's name is unique.
         *
         * This will solve the race-condition problem
         * when user's first join a chat and a default
         * whiteboard is created if none exists.
         * @param models
         * @param options
         */
        add: function(model, options) {
            // if model.name is not already in then collection, then add it
            var whiteboards = this.where({'name': model.name()});
            if (whiteboards.length > 0){
                console.log('Warning: Duplicate model tried to be added the whiteboard collection.');
                return this;
            } else {
                // return this.__super__.add.apply(this, arguments);
                return Backbone.Collection.prototype.add.call(this, model, options);
            }
        },

        /**
         * Cross domain compatible sync.
         */
        sync: xdBackbone.sync,
    });

    /**
     * Whiteboard Path model
     */
    var WhiteboardPath = Backbone.Model.extend({

        idAttribute: 'pathId',

        defaults: function() {
            return {
                pathId: null,
                whiteboardId: null,
                userId: null,
                pathData: null,
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
                this.msg = new messages.WhiteboardCreatePathMessage;
            }

            if(optionsProvided) {
                this.set({
                    pathId: this.msg.pathId,
                    whiteboardId: this.msg.whiteboardId,
                    userId: this.header.userId,
                    pathData: this.msg.pathData,
                });
            }
        },

        // TODO Do we need getters/setters for whiteboardId and pathId?

        userId: function() {
            return this.get('userId');
        },

        setUserId: function(userId) {
            this.set({userId: userId});
            return this;
        },

        pathData: function() {
            return this.get('pathData');
        },

        setPathData: function(pathData) {
            this.set({pathData: pathData});
            return this;
        },

        urlRoot: function() {
            return this.header.url() + this.msg.url();
        },

        /**
         * Cross domain compatible sync.
         */
        sync: xdBackbone.sync,

        parse: function(response) {
            this.header = response.header;
            this.msg = response.msg;

            return {
                pathId: response.msg.pathId,
                whiteboardId: response.msg.whiteboardId,
                userId: response.header.userId,
                pathData: response.msg.pathData,
            };
        },

        toJSON: function() {
            return _.extend(this.attributes, {
                myPath: this.userId() === user.currentUser.id
            });
        }
    });

    /**
     * Whiteboard Path collection.
     */
    var WhiteboardPathCollection = Backbone.Collection.extend({

        model: WhiteboardPath,

        /**
         * Cross domain compatible sync.
         */
        sync: xdBackbone.sync,
    });


    return {
        Whiteboard: Whiteboard,
        WhiteboardCollection: WhiteboardCollection,
        whiteboardCollection: new WhiteboardCollection,
        WhiteboardPath: WhiteboardPath,
        WhiteboardPathCollection: WhiteboardPathCollection,
    };
});
