({
        appDir: ".",
        baseUrl: "../../",
        dir: "../../../../static_minified/js/apps/highlight",
        findNestedDependencies: true,
        modules: [
                { name: "apps/highlight/main" }
        ],

    paths: {
        globalize: '3ps/globalize/globalize',
        jquery: '3ps/jquery/jquery-min',
        'jquery.bootstrap': '3ps/bootstrap/bootstrap-min',
        'jquery.flowplayer': '3ps/flowplayer/flowplayer-3.2.10.min',
        underscore: '3ps/underscore/underscore-min',
        backbone: '3ps/backbone/backbone-min',
        'backbone.localStorage': '3ps/backbone/localStorage-min',
        easyXDM: '3ps/easyXDM/easyXDM',
        raphael: '3ps/raphael/raphael-min',
        spin: '3ps/spin/spin',
        highcharts: '3ps/highcharts/js/highcharts'
    },

    shim: {
        'globalize' : {
            exports: 'Globalize'
        },

        'jquery.bootstrap': ['jquery'],

        'jquery.flowplayer': ['jquery'],

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

