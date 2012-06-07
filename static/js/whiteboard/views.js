define([
    'jQuery',
    'Underscore',
    'Backbone',
    'raphael',
    'core/view',
], function($, _, Backbone, Raphael, view) {


    /**
     * Whiteboard view.
     * This view is a wrapper around the Raphael library.
     *
     * @constructor
     * @param {Object} options
     *   width: whiteboard width
     *   height: whiteboard height
     */
    var WhiteboardView = view.View.extend({
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

            this.color = '#0000FF';

            var toolAttributes = {'stroke': this.color};
            this.tool = new Pen(this.paper, toolAttributes);

        },
        
        render: function() {
            return this;
        },

        /**
         * Set the selected whiteboard tool.
         *
         * @param tool The newly selected tool.
         */
        selectTool: function(tool) {
            this.tool = tool
        },

        /**
         * Set the selected color
         * @param color color as hex string e.g. '#00FF00'
         */
        selectColor: function(color) {
            this.color = color;

            // update the currently selected tool color as well
            var attrs = this.tool.optionalAttributes;
            attrs['stroke'] = color;
            this.tool.optionalAttributes = attrs;
        },

        clear: function() {
            this.paper.clear();
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




    var Pen = function(paper, optionalAttributes) {
        this.paper = paper;
        this.optionalAttributes = optionalAttributes;
        this.path = null;
    }

    Pen.prototype.start = function(x, y) {
        this.path = this.paper.path();
        this.path.attr('path', ['M', x, y].join(' '));
        this.path.attr('stroke-width', '2');

        // override attributes with user defined attributes, if specified
        if (this.optionalAttributes){
            this.path.attr(this.optionalAttributes);
        }
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
    var Arrow = function(paper, optionalAttributes) {
        this.paper = paper;
        this.optionalAttributes = optionalAttributes;
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

        // override attributes with user defined attributes, if specified
        if (this.optionalAttributes){
            this.path.attr(this.optionalAttributes);
        }
    }

    Arrow.prototype.stop = function(x, y) {
        return this.path;
    }

    Arrow.prototype.move = function(x, y) {
        var pathData = this.path.attr('path');
        pathData += ['L', x, y].join(' ');
        this.path.attr('path', pathData);
    }



    var Rectangle = function(paper, optionalAttributes) {
        this.paper = paper;
        this.optionalAttributes = optionalAttributes;
        this.rect = null;
    }

    Rectangle.prototype.start = function(x, y) {
        this.rect = this.paper.rect(x, y, 0, 0, 5);
        this.originX = x;
        this.originY = y;

        // override attributes with user defined attributes, if specified
        if (this.optionalAttributes){
            this.rect.attr(this.optionalAttributes);
        }
    }

    Rectangle.prototype.stop = function(x, y) {
        return this.rect;
    }

    Rectangle.prototype.move = function(x, y) {

        var width = x - this.originX;
        var height = y - this.originY;

        // user is drawing rectangle starting at top left corner
        if (width > 0 && height > 0){
            this.rect.attr('width', width);
            this.rect.attr('height', height);
        }

        // user is drawing rectangle starting at top right corner
        if (width < 0 && height > 0){
            var widthValue = Math.abs(width);
            this.rect.attr('x', this.originX - widthValue);
            this.rect.attr('width', widthValue);
            this.rect.attr('height', height);
        }

        // user is drawing rectangle starting at bottom left corner
        if (width > 0 && height < 0){
            var heightValue = Math.abs(height);
            this.rect.attr('y', this.originY - heightValue);
            this.rect.attr('width', width);
            this.rect.attr('height', heightValue);
        }

        // user is drawing rectangle starting at bottom right corner
        if (width < 0 && height < 0){
            var widthValue = Math.abs(width);
            var heightValue = Math.abs(height);
            this.rect.attr('x', this.originX - widthValue);
            this.rect.attr('y', this.originY - heightValue);
            this.rect.attr('width', widthValue);
            this.rect.attr('height', heightValue);
        }

    }



    var Circle = function(paper, optionalAttributes) {
        this.paper = paper;
        this.optionalAttributes = optionalAttributes;
        this.circle = null;
    }

    Circle.prototype.start = function(x, y) {
        this.circle = this.paper.circle(x, y, 0);

        // override attributes with user defined attributes, if specified
        if (this.optionalAttributes){
            this.circle.attr(this.optionalAttributes);
        }
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


    var Erase = function(paper, optionalAttributes) {
        this.paper = paper;
        this.optionalAttributes = optionalAttributes;

        // note that order of declaration of path and rect impacts z-order
        this.path = null;
        this.rect = null;
    }

    Erase.prototype.start = function(x, y) {
        // constants
        this.centerOffset = 25;
        this.strokeWidth = 50;
        this.cornerRadius = 0;

        // draw eraser boundary
        this.path = this.paper.path();
        this.rect = this.paper.rect(
            x-this.centerOffset,
            y-this.centerOffset,
            this.strokeWidth,
            this.strokeWidth,
            this.cornerRadius);

        // set pen attributes
        this.path.attr('path', ['M', x, y].join(' '));
        this.path.attr('stroke', '#F5F5F5'); // this color matches the Bootstrap 'well' background color
        this.path.attr('stroke-linecap', 'square');
        this.path.attr('stroke-linejoin', 'round');
        this.path.attr('stroke-width', '49');

        // override attributes with user defined attributes, if specified
        if (this.optionalAttributes){
            this.path.attr(this.optionalAttributes);
            this.path.attr('stroke', '#F5F5F5'); // disallow changing this color
        }
    }

    Erase.prototype.stop = function(x, y) {
        this.rect.remove();
        return this.path;
    }

    Erase.prototype.move = function(x, y) {

        var path = this.path.attr('path');
        path += ['L', x, y].join(' ');
        this.path.attr('path', path);

        this.rect.attr('x', x-this.centerOffset);
        this.rect.attr('y', y-this.centerOffset);
    }



    // TODO unfinished. Come back to this later.
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
        Erase: Erase
    }
});
