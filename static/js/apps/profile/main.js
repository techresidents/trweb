require.config({
    paths: {
        Loader: 'loader/loader-min',
        jQuery: 'loader/jquery',
        Underscore: 'loader/underscore',
        Backbone: 'loader/backbone',
        Highcharts: 'loader/highcharts',
    }
});

require([
    'apps/profile/profile',
], function() {
});
