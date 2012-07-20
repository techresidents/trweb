require.config({
    paths: {
        Loader: 'loader/loader-min',
        jQuery: 'loader/jquery',
        Underscore: 'loader/underscore',
        Backbone: 'loader/backbone',
        easyXDM: 'loader/easyXDM'
    }
});

require([
    'apps/profile/profile'
], function() {
});
