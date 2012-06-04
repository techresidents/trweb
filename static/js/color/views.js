define([
    'jQuery',
    'Underscore',
    'core/view',
    'text!color/templates/color_picker.html',
], function(
    $,
    _,
    view,
    whiteboard_color_picker) {

    var EVENTS = {
        SELECT: 'color:Select'
    };

    /**
     * Color Picker View.
     * This View is responsible for displaying a list
     * of colors available for the user to choose from.
     */
    var ColorPickerView = view.View.extend({

        events: {
            "click #whiteboard-black-marker-btn": "blackColorPicked",
            "click #whiteboard-blue-marker-btn": "blueColorPicked",
            "click #whiteboard-green-marker-btn": "greenColorPicked",
            "click #whiteboard-red-marker-btn": "redColorPicked",
        },

        initialize: function() {
            this.template = _.template(whiteboard_color_picker);
        },

        render: function() {
            this.$el.html(this.template());
            // TODO lost my tooltip. Have to provide a function to specify/register a tooltip.
            return this;
        },

        blackColorPicked: function(){
            this.triggerEvent(EVENTS.SELECT, {color:'#000000'});
        },

        blueColorPicked: function(){
            this.triggerEvent(EVENTS.SELECT, {color:'#0000FF'});
        },

        greenColorPicked: function(){
            this.triggerEvent(EVENTS.SELECT, {color:'#00FF00'});
        },

        redColorPicked: function(){
            this.triggerEvent(EVENTS.SELECT, {color:'#FF0000'});
        }
    });

    return {
        EVENTS: EVENTS,
        ColorPickerView: ColorPickerView,
    };

});
