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
     *   rating: {Number} set the star rating. Defaults to 0 (optional)
     */
    var RatingStarsView = view.View.extend({

        // TODO
        // add autosave optional flag
        // clear, or select no stars

        allStarsSelector: '.rating-stars > .rating-star',
        starOnClass: 'rating-star-on',
        starHoverClass: 'rating-star-hover',
        starBackgroundColorClass: '.rating-star-background',

        events: {
            'mouseover .rating-star': 'onMouseover',
            'mouseout .rating-star': 'onMouseout',
            'click .rating-star': 'onClick',
            'click .clear-rating': 'onClear'
        },

        /**
         * Drain background color from all stars
         * @private
         */
        _drainFill: function() {
            this.$(this.allStarsSelector).children().
                filter(this.starBackgroundColorClass).
                removeClass(this.starOnClass).
                removeClass(this.starHoverClass).
                css({ 'width': '100%'}); // don't show partial stars when unlit
        },

        /**
         * Fill in all stars with hover color up to the position of the mouse
         * @param currentTarget
         * @private
         */
        _hoverFill: function(currentTarget) {
            currentTarget.children().filter(this.starBackgroundColorClass).addClass(this.starHoverClass);
            currentTarget.prevAll().children().filter(this.starBackgroundColorClass).addClass(this.starHoverClass);
        },

        /**
         * Determine which rating the user selected
         * @param target JQuery target element
         * @returns {number} Star rating
         * @private
         */
        _determineRating: function(currentTarget) {

            // Note that the order of stars from left-to-right in the
            // HTML is 5,4,3,2,1. This is because there's no way to traverse
            // ancestors in CSS which is required to highlight stars that
            // precede the highlighted star. The work-around was to reverse
            // the reading direction for this element in CSS.

            var starIndex = 0; // no stars selected
            var i = null;
            for (i = 1; i <= this.totalStars; i++) {
                if (currentTarget.children().hasClass('star' + i)) {
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

            // Set model if not passed in
            if (!this.model) {
                this.model = new Backbone.Model({rating: null});
                this.attribute = 'rating';
            }

            // Set rating
            if (options.rating && options.rating <= this.totalStars) {
                this.setRating(options.rating);
            } else {
                this.setRating(0);
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
            var currentRating = this.getRating();
            var i = null, lit = null, fillPercentage = null, partialStar = null;
            for (i = 1; i <= this.totalStars; i++) {
                lit = false;
                fillPercentage = 0;
                if (currentRating) {
                    // Here we take the difference between the index and the
                    // star rating.  If the difference is between 0 and 1, then
                    // we will fill in the star partially after filling all
                    // previous stars.
                    partialStar = i - currentRating;
                    // Is full star lit?
                    if (i <= currentRating) {
                        lit = true;
                        fillPercentage = 100;
                    }
                    // Is partial star lit?
                    if (partialStar > 0 && partialStar < 1) {
                        lit = true;
                        fillPercentage = (currentRating % 1) * 100;
                    }
                }
                starsToRender.push({
                    // starID makes it easy to determine which star is clicked
                    starID: 'star' + i,
                    lit: lit,
                    percentage: fillPercentage
                });
            }

            var context = {
                stars: starsToRender
            };
            this.$el.html(this.template(context));

            return this;
        },

        onMouseover: function(e) {
            var currentTarget = this.$(e.currentTarget);
            this._drainFill();
            this._hoverFill(currentTarget);
        },

        onMouseout: function(e) {
            this._drainFill(); // remove all hover color
            this.render(); // fill in set stars
        },

        onClick: function(e) {
            var currentTarget = this.$(e.currentTarget);
            var rating = this._determineRating(currentTarget);
            this.setRating(rating);
            this.render();
            this.triggerEvent(EVENTS.RATING_CHANGED, {
                rating: rating
            });
        },

        onClear: function(e) {
            this.setRating(0);
            this.render();
        }
    });

    return {
        EVENTS: EVENTS,
        RatingStarsView: RatingStarsView
    };
});
