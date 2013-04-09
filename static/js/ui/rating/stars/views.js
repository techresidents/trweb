define([
    'jquery',
    'underscore',
    'jquery.bootstrap',
    'core/array',
    'core/view',
    'events/type',
    'text!ui/rating/stars/templates/ratingstars.html'
], function(
    $,
    _,
    none,
    array,
    view,
    events_type,
    ratingstars_template) {

    /**
     * Rating Events
     */
    var EventType = {
        CHANGE: events_type.EventType.CHANGE
    };

    /**
     * Rating Stars View.
     * @constructor
     * @param {Object} options
     *   label: {String} text label (optional)
     *   model: {Model} model (optional)
     *   attribute: {String} model attribute (optional)
     *   totalStars: {Number} number of stars. Defaults to 5 (optional)
     *   readonly: {boolean} Readonly model (optional)
     */
    var RatingStarsView = view.View.extend({

        // selectors
        allStarsSelector: '.rating-stars > .rating-star',

        // class names
        starOnClass: 'rating-star-on',
        starHoverClass: 'rating-star-hover',
        starBackgroundColorClass: '.rating-star-background',

        events: {
            'mouseover .rating-star': 'onMouseover',
            'mouseout .rating-star': 'onMouseout',
            'click .rating-star': 'onClick',
            'click .clear-rating': 'onClear'
        },

        initialize: function(options) {
            options = _.extend({
                label: '',
                model: null,
                attribute: null,
                totalStars: 5,
                readonly: false
            }, options);

            this.label = options.label;
            this.model = options.model;
            this.attribute = options.attribute;
            this.totalStars = options.totalStars;
            this.readonly = options.readonly;
            this.template = _.template(ratingstars_template);
            
            // Create a model if not passed in
            if (!this.model) {
                this.model = new Backbone.Model({rating: null});
                this.attribute = 'rating';
                this.setRating(0);
            }

            // Listen for changes to underlying model
            this.listenTo(this.model, 'change:' + this.attribute, this.onChange);
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
                label: this.label,
                stars: starsToRender,
                readonly: this.readonly
            };
            this.$el.html(this.template(context));

            return this;
        },

        onChange: function() {
            this.render();
        },

        onMouseover: function(e) {
            if(this.readonly) {
                return;
            }

            var currentTarget = this.$(e.currentTarget);
            this._drainFill();
            this._hoverFill(currentTarget);
        },

        onMouseout: function(e) {
            if(this.readonly) {
                return;
            }

            this._drainFill(); // remove all hover color
            this.render(); // fill in set stars
        },

        onClick: function(e) {
            if(this.readonly) {
                return;
            }

            var currentTarget = this.$(e.currentTarget);
            var rating = this._determineRating(currentTarget);
            this.setRating(rating);
            this.render();
            this.triggerEvent(EventType.CHANGE, {
                value: rating
            });
        },

        onClear: function(e) {
            if(this.readonly) {
                return;
            }

            this.setRating(0);
            this.render();
            this.triggerEvent(EventType.CHANGE, {
                value: 0
            });
        },

        /**
         * Drain background color (the fill) from all stars
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
            // Fill star at current mouse position
            currentTarget.
                children().
                filter(this.starBackgroundColorClass).
                addClass(this.starHoverClass);
            // Fill all previous stars
            currentTarget.prevAll()
                .children().
                filter(this.starBackgroundColorClass).
                addClass(this.starHoverClass);
        },

        /**
         * Determine which rating the user selected
         * @param target JQuery target element
         * @returns {number} Star rating
         * @private
         */
        _determineRating: function(currentTarget) {
            var starIndex = 0; // no stars selected
            var i = null;
            for (i = 1; i <= this.totalStars; i++) {
                if (currentTarget.children().hasClass('star' + i)) {
                    starIndex = i;
                    break;
                }
            }
            return starIndex;
        }
    });

    return {
        EventType: EventType,
        RatingStarsView: RatingStarsView
    };
});
