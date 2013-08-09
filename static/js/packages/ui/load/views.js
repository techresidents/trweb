define([
    'jquery',
    'underscore',
    'core',
    '../spinner/views'
], function(
    $,
    _,
    core,
    spinner_views) {

    var LoaderView = core.view.View.extend({

        events: {
        },

        /**
         * LoaderView constructor
         * @constructs
         * @param {object} options Options object
         * @param {object} options.loader ApiLoader object
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
         * Loading view which displays a spinner
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

            this.loader = options.loader;

            this.spinnerView = new spinner_views.SpinnerView({
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

            if(options.loader) {
                this.listenTo(this.loader, 'loading', this.spin);
                this.listenTo(this.loader, 'loaded', this.stop);
            }
        },

        childViews: function() {
            return [this.spinnerView];
        },

        destroy: function() {
            if(this.spinner) {
                this.spinner.stop();
            }
            return core.view.View.prototype.destroy.apply(this, arguments);
        },

        spin: function() {
            this.spinnerView.spin(this.el);
        },

        stop: function() {
            this.spinnerView.stop();
        },

        classes: function() {
            return ['loader'];
        },

        render: function() {
            this.$el.empty();
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.spinnerView);
            
            if(this.loader.isLoading()) {
                this.spin();
            }
            return this;
        }

    });
    
    return {
        LoaderView: LoaderView
    };
});
