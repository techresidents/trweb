define([
    'jquery',
    'underscore',
    'core',
    'text!./templates/loader_bar.html'
], function(
    $,
    _,
    core,
    loader_bar_template) {

    var LoaderView = core.view.View.extend({

        events: {
        },

        /**
         * LoaderView constructor
         * @constructs
         * @param {object} options Options object
         * @param {object} options.loader ApiLoader object
         * @param {number} [options.minSpin=0] Min number of ms to spin
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
                minSpin: 0,
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
                minSpin: options.minSpin,
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
            
            if(this.loader && this.loader.isLoading()) {
                this.spin();
            }

            return this;
        }

    });

    var LoaderBarView = core.view.View.extend({

        events: {
        },

        /**
         * LoaderBarView constructor
         * @constructs
         * @param {object} options Options object
         * @param {object} options.loader ApiLoader object
         * @classdesc
         * Loading bar view
         */
        initialize: function(options) {
            options = _.extend({
                template: loader_bar_template,
                easing: 'swing',
                startDuration: 5000,
                stopDuration: 400,
                fadeOutDuration: 800
            }, options);

            this.template = _.template(options.template);
            this.easing = options.easing;
            this.startDuration = options.startDuration;
            this.stopDuration = options.stopDuration;
            this.fadeOutDuration = options.fadeOutDuration;
            this.loader = options.loader;
            this.loading = false;

            if(options.loader) {
                this.listenTo(this.loader, 'loading', this.start);
                this.listenTo(this.loader, 'loaded', this.stop);
            }
        },

        destroy: function() {
            this.stop();
            return core.view.View.prototype.destroy.apply(this, arguments);
        },

        start: function() {
            console.log(this._bar().width());
            //stop any active animation
            this._bar().stop();

            this.loading = true;
            this._bar().show();
            this._bar().animate({
                width: '80%'
            }, {
                easing: this.easing,
                duration: this.startDuration
            });
        },

        stop: function() {
            if(this.loading) {
                //stop current animation
                this._bar().stop();

                this._bar().animate({
                    width: '100%'
                }, {
                    easing: this.easing,
                    duration: this.stopDuration,
                    complete: function() {
                        $(this).fadeOut({
                            duration: this.fadeOutDuration,
                            complete: function() {
                                $(this).width(0);
                            }
                        });
                    }
                });

                this.loading = false;
            }
        },

        classes: function() {
            return ['loaderbar'];
        },

        render: function() {
            //get current percentage width so we can maintain it across
            //multiple render() calls.
            var width = this._bar().width();

            this.$el.html(this.template());
            this.$el.attr('class', this.classes().join(' '));
            this._bar().width(width + '%');

            if(this.loader) {
                if(this.loader.isLoading()) {
                    this.start();
                } else if(this.loading && !this.loader.isLoading()) {
                    this.stop();
                }
            } else if(this.loading) {
                this.start();
            }

            return this;
        },

        _bar: function() {
            return this.$('.loaderbar-bar');
        }

    });
    
    return {
        LoaderView: LoaderView,
        LoaderBarView: LoaderBarView
    };
});
