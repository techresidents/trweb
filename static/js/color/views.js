define([
    'jQuery',
    'Underscore',
    'chat/whiteboard/models',
    'core/view',
    'text!color/templates/color_picker.html',
], function(
    $,
    _,
    whiteboard_models,
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

        colorSelector: '#select-color-button',
        buttonClasses: 'btn-primary btn-info btn-success btn-warning btn-danger btn-inverse',

        events: {
            'click #black-btn': 'blackColorPicked',
            'click #blue-btn': 'blueColorPicked',
            'click #green-btn': 'greenColorPicked',
            'click #red-btn': 'redColorPicked',
        },

        initialize: function() {
            this.template = _.template(whiteboard_color_picker);

            // setup viewModel listeners
            this.viewModel = this.options.viewModel;
            this.viewModel.on('change:selectedColor', this.onColorChange, this);
        },

        render: function() {
            this.$el.html(this.template());

            // read the view model to determine which color to show as currently selected
            this.onColorChange();

            // TODO lost my tooltip. Have to provide a function to specify/register a tooltip.
            return this;
        },

        /**
         * This function responds to changes in the viewModel.
         * It will ensure that this control view matches the viewModel at all times.
         */
        onColorChange: function() {

            var color = this.viewModel.getSelectedColor();
            var colorClass = null;
            var colorText = null;

            switch(color) {
                case whiteboard_models.WhiteboardValueObject.COLORS.BLACK:
                    colorText = 'Black';
                    colorClass = 'btn-inverse';
                    break;
                case whiteboard_models.WhiteboardValueObject.COLORS.BLUE:
                    colorText = 'Blue';
                    colorClass = 'btn-primary';
                    break;
                case whiteboard_models.WhiteboardValueObject.COLORS.GREEN:
                    colorText = 'Green';
                    colorClass = 'btn-success';
                    break;
                case whiteboard_models.WhiteboardValueObject.COLORS.RED:
                    colorText = 'Red';
                    colorClass = 'btn-danger';
                    break;
                default:
                    // ignore the change
                    break;
            }

            if (null != colorText &&
                null != colorClass)
            {
                // change the text & color of the button
                this.$(this.colorSelector).html(this._getColorHtmlString(colorText));
                this.$(this.colorSelector).removeClass(this.buttonClasses).addClass(colorClass);
            }
        },

        blackColorPicked: function(){
            this.triggerEvent(EVENTS.SELECT, {color: whiteboard_models.WhiteboardValueObject.COLORS.BLACK});
        },

        blueColorPicked: function(){
            this.triggerEvent(EVENTS.SELECT, {color: whiteboard_models.WhiteboardValueObject.COLORS.BLUE});
        },

        greenColorPicked: function(){
            this.triggerEvent(EVENTS.SELECT, {color: whiteboard_models.WhiteboardValueObject.COLORS.GREEN});
        },

        redColorPicked: function(){
            this.triggerEvent(EVENTS.SELECT, {color: whiteboard_models.WhiteboardValueObject.COLORS.RED});
        },

        /**
         * Convenience function to generate button text html
         * @param colorName The color name
         * @return {String}
         * @private
         */
        _getColorHtmlString: function(colorName){
            return colorName + ' <span class="caret">';
        }
    });

    return {
        EVENTS: EVENTS,
        ColorPickerView: ColorPickerView,
    };

});
