define([
    'jquery',
    'underscore',
    'jquery.bootstrap',
    'core/array',
    'core/view',
    'text!ratingstars/templates/ratingstars.html'
], function(
    $,
    _,
    none,
    array,
    view,
    ratingstars_template) {

    /**
     * Rating Events
     */
    var EVENTS = {
        RATING_CHANGED: 'RATING_CHANGED_EVENT'
    };

    /**
     * Rating Stars View.
     * @constructor
     * @param {Object} options
     *   model: {Model} model (optional)
     *   attribute: {String} model attribute (optional)
     *   totalStars: {Number} number of stars. Defaults to 5 (optional)
     */
    var RatingStarsView = view.View.extend({

        // TODO
        // add autosave optional flag
        // research xbrowser support for star character

        allStarsSelector: '.ratingstars > span',

        events: {
            'click .ratingstars > span': 'onClickStar'
        },

        /**
         * Determine which rating the user selected
         * @param target JQuery target element
         * @returns {number} Star rating
         * @private
         */
        _determineRating: function(target) {

            // Note that the order of stars from left-to-right in the
            // HTML is 5,4,3,2,1. This is because there's no way to traverse
            // ancestors in CSS which is required to highlight stars that
            // precede the highlighted star. The work-around was to reverse
            // the reading direction for this element in CSS.

            var starIndex = 0; // no stars selected
            var i = null;
            for (i = 1; i <= this.totalStars; i++) {
                if (target.hasClass('star' + i)) {
                    starIndex = i;
                    break;
                }
            }
            return starIndex;
        },

        initialize: function(options) {
            this.model = options.model ? options.model : null;
            this.attribute = options.attribute ? options.attribute : null;
            this.totalStars = options.totalStars ? options.totalStars : 5;
            this.template = _.template(ratingstars_template);

            if (!this.model) {
                this.model = new Backbone.Model({rating: null});
                this.attribute = 'rating';
            }

            // Listen for changes to underlying model
            this.listenTo(this.model, 'change:' + this.attribute, this.render);
        },

        getRating: function() {
            return this.model.get(this.attribute);
        },

        setRating: function(value) {
            this.model.set(this.attribute, value);
            return this;
        },

        render: function() {
            var starsToRender = [];
            var rating = this.getRating();
            var i = null;
            var lit = null;

            for (i = 1; i <= this.totalStars; i++) {
                lit = false;
                if (rating) {
                    if (i <= rating) {
                        lit = true;
                    }
                }
                // Add items such that the last star is first in the array.
                // This needs to happen since the HTML reads from right-to-left.
                starsToRender.unshift({
                    // label makes it easy to determine which stars is clicked
                    label: 'star' + i,
                    lit: lit
                });
            }
            var context = {
                stars: starsToRender
            };
            this.$el.html(this.template(context));
            return this;
        },

        onClickStar: function(e) {
            var target = $(e.currentTarget);
            var rating = this._determineRating(target);
            this.setRating(rating);
            this.render();
            this.triggerEvent(EVENTS.RATING_CHANGED, {
                rating: rating
            });
        }
    });

    return {
        EVENTS: EVENTS,
        RatingStarsView: RatingStarsView
    };
});
