require.config({
    paths: {
        Loader: 'loader/loader-min',
        jQuery: 'loader/jquery',
        Underscore: 'loader/underscore',
        Backbone: 'loader/backbone'
    }
});

require([
    'apps/ptidemo/ptidemo',
], function() {
});