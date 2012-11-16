({
        appDir: ".",
        baseUrl: "../../",
        dir: "../../../../static_minified/js/apps/talent",
        modules: [
                { name: "apps/talent/main" }
        ],

    paths: {
        globalize: '3ps/globalize/globalize',
        jquery: '3ps/jquery/jquery',
        'jquery.bootstrap': '3ps/bootstrap/bootstrap',
        underscore: '3ps/underscore/underscore',
        backbone: '3ps/backbone/backbone',
        'backbone.localStorage': '3ps/backbone/localStorage',
        easyXDM: '3ps/easyXDM/easyXDM',
        raphael: '3ps/raphael/raphael',
        spin: '3ps/spin/spin',
        highcharts: '3ps/highcharts/js/highcharts'
    },

    shim: {

        'globalize' : {
            exports: 'Globalize'
        },

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
        },

        'spin': {
            deps: [],
            exports: 'Spinner'
        },

        'highcharts': {
            deps: ['jquery'],
            exports: 'Highcharts'
        }
    }
})

