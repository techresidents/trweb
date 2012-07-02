define([
    'jQuery',
    'Underscore',
    'Backbone',
], function($, _, Backbone) {
 
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
        },

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

        paths: function() {
            return this.get('paths');
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
        },

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
    });


    /**
     * Whiteboard Path collection.
     */
    var WhiteboardPathCollection = Backbone.Collection.extend({

        model: WhiteboardPath,
    });


    /**
     * Model to store whiteboard UI state.
     */
    var WhiteboardValueObject = Backbone.Model.extend({

        localStorage: new Backbone.LocalStorage('WhiteboardValueObject'),

        defaults: function() {
            return {
                selectedWhiteboardId: null,
                selectedTool: WhiteboardValueObject.TOOLS.PEN,     // refs tool name string
                selectedColor: WhiteboardValueObject.COLORS.BLUE   // refs color name string
            };
        },

        validate: function(attrs) {

            var tool = attrs.selectedTool;
            if (tool != WhiteboardValueObject.TOOLS.PEN &&
                tool != WhiteboardValueObject.TOOLS.ARROW &&
                tool != WhiteboardValueObject.TOOLS.RECTANGLE &&
                tool != WhiteboardValueObject.TOOLS.CIRCLE &&
                tool != WhiteboardValueObject.TOOLS.ERASE)
            {
                return 'WhiteboardValueObject: Invalid tool value';
            }

            var color = attrs.selectedColor;
            if (color != WhiteboardValueObject.COLORS.BLACK &&
                color != WhiteboardValueObject.COLORS.BLUE &&
                color != WhiteboardValueObject.COLORS.GREEN &&
                color != WhiteboardValueObject.COLORS.RED)
            {
                return 'WhiteboardValueObject: Invalid color value';
            }
        },

        initialize: function(attributes, options) {
        },

        whiteboards: function() {
            return this.get('whiteboards');
        },

        getSelectedWhiteboardId: function() {
            return this.get('selectedWhiteboardId');
        },

        setSelectedWhiteboard: function(whiteboardId) {
            this.set({selectedWhiteboardId: whiteboardId});
            return this;
        },

        getSelectedTool: function() {
            return this.get('selectedTool');
        },

        setSelectedTool: function(toolName) {
            this.set({selectedTool: toolName});
            return this;
        },

        getSelectedColor: function() {
            return this.get('selectedColor');
        },

        setSelectedColor: function(colorValue) {
            this.set({selectedColor: colorValue});
            return this;
        }
    }, {
        // class properties
        COLORS: {
            BLACK: 'BLACK',
            BLUE: 'BLUE',
            GREEN: 'GREEN',
            RED: 'RED'
        },

        TOOLS: {
            PEN: 'PEN',
            ARROW: 'ARROW',
            RECTANGLE: 'RECTANGLE',
            CIRCLE: 'CIRCLE',
            ERASE: 'ERASE'
        }
    });


    return {
        Whiteboard: Whiteboard,
        WhiteboardCollection: WhiteboardCollection,
        whiteboardCollection: new WhiteboardCollection,
        WhiteboardPath: WhiteboardPath,
        WhiteboardPathCollection: WhiteboardPathCollection,
        WhiteboardValueObject: WhiteboardValueObject,
    };
});
