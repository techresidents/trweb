
require.config({

    urlArgs: window.location.hostname === 'localhost' ? 'bust' + new Date().getTime() : null,

    paths: {
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
        soundmanager2: '3ps/soundmanager/script/soundmanager2'
    },

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
        }
    }
});

require([
    'apps/requisition/requisition'
], function() {
});