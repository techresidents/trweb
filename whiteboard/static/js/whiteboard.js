$(document).ready(function() {
    
    var Whiteboard = function() {
        this.element = $("#whiteboard");
        this.element.height(400);
        this.paper = Raphael("whiteboard", this.element.width(), 400);
        this.capturing = false;

        this.pen = new Pen(this.paper);
        this.rectangle = new Rectangle(this.paper);
        this.circle = new Circle(this.paper);
        this.tool = this.pen;
        
        var that = this;
        this.element.mousedown(function(event) {
            that.onMouseDown.call(that, event);
        });

        this.element.mouseup(function(event) {
            that.onMouseUp.call(that, event);
        });

        this.element.mousemove(function(event) {
            that.onMouseMove.call(that, event);
        });

        $("#pen-button").click(function(event) {
            that.tool = that.pen;
        });

        $("#rect-button").click(function(event) {
            that.tool = that.rectangle;
        });

        $("#circle-button").click(function(event) {
            that.tool = that.circle;
        });

        $("#clear-button").click(function(event) {
            that.paper.clear();
        });
    };

    Whiteboard.prototype.onMouseDown = function(event) {
        var offset = this.element.offset();
        var x = event.clientX - offset.left;
        var y = event.clientY - offset.top;
        this.tool.start(x, y);
        this.capturing = true;
    };

    Whiteboard.prototype.onMouseUp = function(event) {
        var offset = this.element.offset();
        var x = event.clientX - offset.left;
        var y = event.clientY - offset.top;
        this.tool.stop(x, y);
        this.capturing = false;
    };

    Whiteboard.prototype.onMouseMove = function(event) {
        if(!this.capturing) {
            return;
        }

        var offset = this.element.offset();
        var x = event.clientX - offset.left;
        var y = event.clientY - offset.top;
        this.tool.move(x, y);
    };

    var Pen = function(paper) {
        this.paper = paper;
        this.path = null;
    }

    Pen.prototype.start = function(x, y) {
        this.path = this.paper.path();
        this.path.attr("path", ['M', x, y].join(' '));
    }

    Pen.prototype.stop = function(x, y) {
        this.path = null;
    }

    Pen.prototype.move = function(x, y) {
        var path = this.path.attr("path");
        path += ['L', x, y].join(' ');
        this.path.attr("path", path);
    }

    var Rectangle = function(paper) {
        this.paper = paper;
        this.rect = null;
    }

    Rectangle.prototype.start = function(x, y) {
        this.rect = this.paper.rect(x, y, 0, 0, 5);
        console.log(this.rect);
    }

    Rectangle.prototype.stop = function(x, y) {
        this.rect = null;
    }

    Rectangle.prototype.move = function(x, y) {
        var originX = this.rect.attr("x");
        var originY = this.rect.attr("y");

        this.rect.attr("width", x - originX);
        this.rect.attr("height", y - originY);
    }

    var Circle = function(paper) {
        this.paper = paper;
        this.circle = null;
    }

    Circle.prototype.start = function(x, y) {
        this.circle = this.paper.circle(x, y, 0);
        console.log(this.circle);
    }

    Circle.prototype.stop = function(x, y) {
        this.circle = null;
    }

    Circle.prototype.move = function(x, y) {
        var originX = this.circle.attr("cx");
        var originY = this.circle.attr("cy");

        var xs = x - originX;
        xs = xs * xs;

        var ys = y - originY;
        ys = ys * ys;

        var radius = Math.sqrt(xs + ys);

        this.circle.attr("r", radius);
    }


    var whiteboard = new Whiteboard();

});
