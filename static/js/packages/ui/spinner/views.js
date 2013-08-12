define([
    'jquery',
    'underscore',
    'core',
    'spin'
], function(
    $,
    _,
    core,
    Spinner) {

    var SpinnerView = core.view.View.extend({

        /**
         * SpinnerView constructor
         * @constructs
         * @augments module:core/view~View
         * @param {object} options Options object
         * @param {number} [options.lines=11] Number of spinner lines
         * @param {number} [options.length=5] Length of spinner lines
         * @param {number} [options.width=3] Width of spinner lines
         * @param {number} [options.radius=6] Radius of spinner
         * @param {number} [options.speed=1] Speed of spinner
         * @param {number} [options.trail=60] Afterglow percentage for spinner
         * @param {string} [options.color='#000'] Color of spinner
         * @param {boolean} [options.shadow=false] Show spinner shadow
         * @param {string|number} [options.top='auto'] Spinner position
         * relative to parent
         * @param {string|number} [options.left='auto'] Spinner position
         * relative to parent
         * @classdesc
         * Displays a spinner
         */
        initialize: function(options) {
            options = _.extend({
                lines: 11,
                length: 5,
                width: 3,
                radius: 6,
                color: '#000000',
                speed: 1,
                trail: 60,
                shadow: false,
                top: 'auto',
                left: 'auto'
            }, options);
            
            this.spinner = new Spinner({
                lines: options.lines,
                length: options.length,
                width: options.width,
                radius: options.radius,
                color: options.color,
                speed: options.speed,
                trail: options.trail,
                shadow: options.shadow,
                top: options.top,
                left: options.left
            });
        },

        destroy: function() {
            if(this.spinner) {
                this.spinner.stop();
            }
            return core.view.View.prototype.destroy.apply(this, arguments);
        },

        spin: function(el) {
            el = el || this.el;
            this.spinner.spin(el);
        },

        stop: function() {
            this.spinner.stop();
        },

        render: function() {
            this.$el.empty();
            return this;
        }

    });
    
    return {
        SpinnerView: SpinnerView
    };
});
