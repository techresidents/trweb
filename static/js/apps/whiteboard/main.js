require.config({

    paths: {
        jquery: '3ps/jquery/jquery',
        'jquery.bootstrap': '3ps/bootstrap/bootstrap',
        underscore: '3ps/underscore/underscore',
        backbone: '3ps/backbone/backbone',
        'backbone.localStorage': '3ps/backbone/localStorage',
        easyXDM: '3ps/easyXDM/easyXDM',
        raphael: '3ps/raphael/raphael'
    },

    shim: {
        'jquery.bootstrap': ['jquery'],

        'underscore': {
            deps: ['jquery'],
            exports: '_'
        },

        'backbone': {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        
        'backbone.localStorage': ['backbone'],

        'easyXDM': {
            deps: ['jquery'],
            exports: 'easyXDM'
        },

        'raphael': {
            deps: [],
            exports: 'Raphael'
        }
    }
});

require([
    'apps/whiteboard/whiteboard'
], function() {
});
