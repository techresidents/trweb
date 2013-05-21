({

    baseUrl: "../../..",

    dir: "./dist",

    modules: [
        { name: "main", excludeShallow: ["core/array"] },
        { name: "ui", exclude: ["main"] }
    ],

    paths: {
        main: 'apps/developer/src/main',
        globalize: '3ps/globalize/globalize',
        jquery: '3ps/jquery/jquery',
        'jquery.bootstrap': '3ps/bootstrap/bootstrap',
        'jquery.flowplayer': '3ps/flowplayer/flowplayer-3.2.10.min',
        underscore: '3ps/underscore/underscore',
        backbone: '3ps/backbone/backbone',
        'backbone.localStorage': '3ps/backbone/localStorage',
        easyXDM: '3ps/easyXDM/easyXDM',
        raphael: '3ps/raphael/raphael',
        spin: '3ps/spin/spin',
        highcharts: '3ps/highcharts/js/highcharts.src',
        soundmanager2: '3ps/soundmanager/script/soundmanager2',
        twilio: 'http://static.twilio.com/libs/twiliojs/1.1/twilio.min'
    },
    
    packages: [
        { name: 'alert', location: 'packages/alert' },
        { name: 'api', location: 'packages/api' },
        { name: 'chat', location: 'packages/chat' },
        { name: 'core', location: 'packages/core' },
        { name: 'ctrl', location: 'packages/ctrl' },
        { name: 'events', location: 'packages/events' },
        { name: 'notifications', location: 'packages/notifications' },
        { name: 'ui', location: 'packages/ui' },
        { name: 'xd', location: 'packages/xd' }
    ],

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
        },

        'soundmanager2': {
            exports: 'soundManager'
        },

        'twilio': {
            exports: 'Twilio'
        }
    }
})

