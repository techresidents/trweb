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
        // use inline divs instead of spans, or <li>
        // pass percentage to template
        // in template, apply style using percentage
        // look at overlapping divs in player

        allStarsSelector: '.rating-stars > .rating-star',

        events: {
            'mouseover .rating-star': 'onMouseover',
            'mouseout .rating-star': 'onMouseout',
            'click .rating-star': 'onClick'
        },

        /**
         * Drain background color from all stars
         * @private
         */
        _drainFill: function() {
            this.$(this.allStarsSelector).children().
                removeClass('rating-star-on').
                removeClass('rating-star-hover');
        },

        /**
         * Fill in all stars with hover color up to the position of the mouse
         * @param currentTarget
         * @private
         */
        _hoverFill: function(currentTarget) {
            currentTarget.children().filter('.rating-star-background').addClass('rating-star-hover');
            currentTarget.prevAll().children().filter('.rating-star-background').addClass('rating-star-hover');
        },

        /**
         * Fill in all stars that are set
         * @param currentTarget
         * @private
         */
        _selectedFill: function() {
            var starID = null;
            var starElement = null;
            var currentRating = this.getRating();
            if (currentRating) {
                starID = '.star' + currentRating;
                starElement = this.$(this.allStarsSelector).children().filter(starID);
                // fill in last star
                starElement.addClass('rating-star-on');
                // fill in all previous stars
                starElement.parent().prevAll().children().filter('.rating-star-background').addClass('rating-star-on');
            }
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
                starsToRender.push({
                    // label makes it easy to determine which stars is clicked
                    starID: 'star' + i,
                    lit: lit
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
            this._selectedFill(); // fill in selected stars
        },

        onClick: function(e) {
            var currentTarget = this.$(e.currentTarget);
            var rating = this._determineRating(currentTarget);
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
