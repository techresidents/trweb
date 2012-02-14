require.config({
    paths: {
        Loader: 'loader/loader',
        jQuery: 'loader/jquery',
        Underscore: 'loader/underscore',
        Backbone: 'loader/backbone',
        Highcharts: 'loader/highcharts',
    }
});

require([
    'apps/topic/topic',
], function() {
});
