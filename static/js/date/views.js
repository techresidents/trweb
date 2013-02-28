define([
    'jquery',
    'underscore',
    'core/view',
    'text!date/templates/date.html'
], function(
    $,
    _,
    view,
    date_template) {

    var EVENTS = {
    };

    /**
     * Date Picker View.
     * @constructor
     * @param {Object} options
     *   collection: {Collection} collection (required)
     *   map: {Function} map function (optional)
     *     if collection is not a {ChoiceCollection}
     *     a map function must be supplied to convert
     *     a collection model to a {Choice} model.
     */
    var DatePickerView = view.View.extend({

        defaultTemplate: date_template,

        events: {
        },
        
        initialize: function(options) {
            this.template = _.template(this.defaultTemplate);
            this.collection = options.collection;
            this.map = options.map;
        },

        classes: function() {
            return ['date'];
        },

        render: function() {
            var context = this.context();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        }
    });

    return {
        EVENTS: EVENTS,
        DatePickerView: DatePickerView
    };

});
