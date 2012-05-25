define([
    'jQuery',
    'Underscore',
    'Backbone',
    'raphael',
], function($, _, Backbone, Raphael) {


    /**
     * Whiteboard view.
     * @constructor
     * @param {Object} options
     *   width: whiteboard width
     *   height: whiteboard height
     */
    var WhiteboardView = Backbone.View.extend({
        tagName: 'div',
        
        events: {
            'mousedown': 'mousedown',
            'mousemove': 'mousemove',
            'mouseup': 'mouseup',
        },

        initialize: function() {
            this.capturing = false;

            //set width and height
            if(this.options.width) {
                $(this.el).width(this.options.width);
            }
            
            if(this.options.height) {
                $(this.el).height(this.options.height);
            }
            
            // set logical (scrollable) paper size if options provided
            // otherwise use container sizes
            var paperWidth = this.options.paperWidth || $(this.el).width();
            var paperHeight = this.options.paperHeight || $(this.el).height();
            
            // if paper size size is larger than element size, set overflow for scrolling
            if(paperWidth > $(this.el).width() || paperHeight > $(this.el).height()) {
                var paperWidth = this.options.paperWidth || $(this.el).width();
                $(this.el).css('overflow', 'auto');
            }
            
            this.paper = Raphael(
                $(this.el).get(0),
                paperWidth,
                paperHeight);


            this.tool = new Pen(this.paper);
        },
        
        render: function() {
            return this;
        },

        selectTool: function(tool) {
            this.tool = tool;
        },

        clear: function() {
            this.paper.clear();
            this.onBoardCleared();
        },

        adjustedCoordinates: function(event) {
            //TODO deal with clientX/ClientY if pageX/pageY are unaavailable.
            //This will requuire adjusting for the page scrollbar position.
            
            var offset = $(this.el).offset();
            return {
                x: event.pageX - offset.left + $(this.el).scrollLeft(),
                y: event.pageY - offset.top + $(this.el).scrollTop()
            };
        },

        mousedown: function(event) {
            var coordinates = this.adjustedCoordinates(event);
            this.tool.start(coordinates.x, coordinates.y);
            this.capturing = true;
        },

        mousemove: function(event) {
            if(!this.capturing) {
                return;
            }

            var coordinates = this.adjustedCoordinates(event);
            this.tool.move(coordinates.x, coordinates.y);
        },

        mouseup: function(event) {
            var coordinates = this.adjustedCoordinates(event);
            var element = this.tool.stop(coordinates.x, coordinates.y);
            this.capturing = false;

            this.onElementAdded(this.tool, element);

        },

        // To be overridden by Views/Controllers to listen for this event
        onElementAdded: function(tool, element) {

        },

        // To be overridden by Views/Controllers to listen for this event
        onElementRemoved: function(element){

        },

        // To be overridden by Views/Controllers to listen for this event
        onBoardCleared: function(){

        }

    });


    var WhiteboardToolView = Backbone.View.extend({
        tagName: 'div',

        events: {
            'click #pen-button': 'selectPen',
            'click #rect-button': 'selectRect',
            'click #circle-button': 'selectCircle',
            'click #clear-button': 'clear',
        },

        initialize: function() {
            this.whiteboard = this.options.whiteboard;
            this.pen = new Pen(this.whiteboard.paper);
            this.circle = new Circle(this.whiteboard.paper);
            this.rect = new Rectangle(this.whiteboard.paper);
        },

        selectPen: function() {
            this.whiteboard.selectTool(this.pen);
        },

        selectRect: function() {
            this.whiteboard.selectTool(this.rect);
        },

        selectCircle: function() {
            this.whiteboard.selectTool(this.circle);
        },

        clear: function() {
            this.whiteboard.clear();
        }
            
    });


    var Pen = function(paper) {
        this.paper = paper;
        this.path = null;
    }

    Pen.prototype.start = function(x, y) {
        this.path = this.paper.path();
        this.path.attr('path', ['M', x, y].join(' '));
        this.path.attr('stroke-width', '2');
    }

    Pen.prototype.stop = function(x, y) {
        return this.path;
    }

    Pen.prototype.move = function(x, y) {
        var path = this.path.attr('path');
        path += ['L', x, y].join(' ');
        this.path.attr('path', path);
    }


    // TODO use inheritance here. Create tool prototype. Arrow should inherit from Pen.
    var Arrow = function(paper) {
        this.paper = paper;
        this.path = null;
    }

    Arrow.prototype.start = function(x, y) {
        this.path = this.paper.path();
        var pathData =[
            ['M', x, y].join(' '),
            ['L', x, y].join(' ')
        ];
        this.path.attr('path', pathData);
        this.path.attr('stroke-width', 2);
        this.path.attr('arrow-end', 'open');
    }

    Arrow.prototype.stop = function(x, y) {
        return this.path;
    }

    Arrow.prototype.move = function(x, y) {
        var pathData = this.path.attr('path');
        pathData += ['L', x, y].join(' ');
        this.path.attr('path', pathData);
    }


    var Rectangle = function(paper) {
        this.paper = paper;
        this.rect = null;
    }

    Rectangle.prototype.start = function(x, y) {
        this.rect = this.paper.rect(x, y, 0, 0, 5);
    }

    Rectangle.prototype.stop = function(x, y) {
        return this.rect;
    }

    Rectangle.prototype.move = function(x, y) {
        var originX = this.rect.attr('x');
        var originY = this.rect.attr('y');

        this.rect.attr('width', x - originX);
        this.rect.attr('height', y - originY);
    }


    var Circle = function(paper) {
        this.paper = paper;
        this.circle = null;
    }

    Circle.prototype.start = function(x, y) {
        this.circle = this.paper.circle(x, y, 0);
    }

    Circle.prototype.stop = function(x, y) {
        return this.circle;
    }

    Circle.prototype.move = function(x, y) {
        var originX = this.circle.attr('cx');
        var originY = this.circle.attr('cy');

        var xs = x - originX;
        xs = xs * xs;

        var ys = y - originY;
        ys = ys * ys;

        var radius = Math.sqrt(xs + ys);

        this.circle.attr('r', radius);
    }






    var Text = function(paper) {
        this.paper = paper;
        this.text = null;
    }

    Text.prototype.start = function(x, y) {

        // show cursor for text input
        // append to x y coordinate
        // on enter, capture text, remove div
        // send text to paper



        var textInput = new ChatWhiteboardTextInputView();
        console.log(textInput.render().el);
        //$(textInput.render().el).insertAfter()
        $('#whiteboard-wrapper').append(textInput.render().el);
        //var offsetX = $('whiteboard-wrapper').offset().left;
        //var offsetY = $('whiteboard-wrapper').offset().top;
        $('.whiteboard-text-input').css('top', y + 'px');
        $('.whiteboard-text-input').css('left', x + 'px');

        this.text = this.paper.text(x, y, 'test');
        //this.text.attr('font-size', 24);
    }

    Text.prototype.stop = function(x, y) {
        return this.text;
    }

    Text.prototype.move = function(x, y) {
        // no-op
    }




    /**
     * Whiteboard text input layout.
     * @constructor
     */
    var ChatWhiteboardTextInputView = Backbone.View.extend({

        templateSelector: '#whiteboard-text-input-template',

        initialize: function() {
            this.template = _.template($(this.templateSelector).html());
        },

        render: function() {
            this.$el.html(this.template());
            return this;
        },

    });





    return {
        WhiteboardView: WhiteboardView,
        WhiteboardToolView: WhiteboardToolView,
        Pen: Pen,
        Arrow: Arrow,
        Rectangle: Rectangle,
        Circle: Circle,
        Text: Text,
    }
});
