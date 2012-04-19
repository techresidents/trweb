require.config({
    paths: {
        Loader: 'loader/loader',
        jQuery: 'loader/jquery',
        Underscore: 'loader/underscore',
        Backbone: 'loader/backbone',
        Highcharts: 'loader/highcharts',
        easyXDM: 'loader/easyXDM',
        raphael: 'loader/raphael',
        spin: 'loader/spin',
    }
});

require([
    'apps/chat/chat',
], function() {
});
