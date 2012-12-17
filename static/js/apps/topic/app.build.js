({
        appDir: ".",
        baseUrl: "../../",
        dir: "../../../../static_minified/js/apps/topic",
        modules: [
                { name: "apps/topic/main" }
        ],

    paths: {
        globalize: '3ps/globalize/globalize',
        jquery: '3ps/jquery/jquery-min',
        'jquery.bootstrap': '3ps/bootstrap/bootstrap-min',
        underscore: '3ps/underscore/underscore-min',
        backbone: '3ps/backbone/backbone-min',
        'backbone.localStorage': '3ps/backbone/localStorage-min',
        easyXDM: '3ps/easyXDM/easyXDM'
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
        }
    }
})

