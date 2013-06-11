({

    baseUrl: "../../..",

    dir: "./dist",

    modules: [
        { name: "main", excludeShallow: [] },
        { name: 'alert', exclude: ["main"] },
        { name: 'api', exclude: ["main"] },
        { name: 'applicant', exclude: ["main"] },
        { name: 'chat', exclude: ["main"] },
        { name: 'core', exclude: ["main"] },
        { name: 'ctrl', exclude: ["main"] },
        { name: 'events', exclude: ["main"] },
        { name: 'lookup', exclude: ["main"] },
        { name: 'notifications', exclude: ["main"] },
        { name: 'player', exclude: ["main"] },
        { name: 'requisition', exclude: ["main"] },
        { name: 'search', exclude: ["main"] },
        { name: 'soundmanager', exclude: ["main"] },
        { name: 'ui', exclude: ["main"] },
        { name: 'user', exclude: ["main"] },
        { name: 'xd', exclude: ["main"] }
    ],

    paths: {
        main: 'apps/employer/src/main',
        globalize: '3ps/globalize/globalize',
        jquery: '3ps/jquery/jquery',
        'jquery.bootstrap': '3ps/bootstrap/bootstrap',
        'jquery.flowplayer': '3ps/flowplayer/flowplayer-3.2.10.min',
        'jquery.validate': '3ps/jqueryvalidate/jquery.validate.min',
        underscore: '3ps/underscore/underscore',
        backbone: '3ps/backbone/backbone',
        'backbone.localStorage': '3ps/backbone/localStorage',
        easyXDM: '3ps/easyXDM/easyXDM',
        raphael: '3ps/raphael/raphael',
        spin: '3ps/spin/spin',
        highcharts: '3ps/highcharts/js/highcharts.src',
        soundmanager2: '3ps/soundmanager/script/soundmanager2',
        //twilio: 'http://static.twilio.com/libs/twiliojs/1.1/twilio.min'
        twilio: 'empty:'
    },

    packages: [
        { name: 'alert', location: 'packages/alert' },
        { name: 'api', location: 'packages/api' },
        { name: 'applicant', location: 'packages/applicant' },
        { name: 'chat', location: 'packages/chat' },
        { name: 'core', location: 'packages/core' },
        { name: 'ctrl', location: 'packages/ctrl' },
        { name: 'events', location: 'packages/events' },
        { name: 'lookup', location: 'packages/lookup' },
        { name: 'notifications', location: 'packages/notifications' },
        { name: 'player', location: 'packages/player' },
        { name: 'requisition', location: 'packages/requisition' },
        { name: 'search', location: 'packages/search' },
        { name: 'soundmanager', location: 'packages/soundmanager' },
        { name: 'ui', location: 'packages/ui' },
        { name: 'user', location: 'packages/user' },
        { name: 'xd', location: 'packages/xd' }
    ],

    shim: {

        'globalize' : {
            exports: 'Globalize'
        },

        'jquery.bootstrap': ['jquery'],

        'jquery.flowplayer': ['jquery'],

        'jquery.validate': ['jquery'],

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

