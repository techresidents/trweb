require.config({
    paths: {
        Loader: 'loader/loader',
        jQuery: 'loader/jquery',
        Underscore: 'loader/underscore',
        Backbone: 'loader/backbone',
        Highcharts: 'loader/highcharts',
        easyXDM: 'loader/easyXDM',
    }
});

require([
    'apps/chat/chat',
], function() {
});
