define([
    'core',
    'notifications'
], function(
    core,
    notifications) {

    /**
     * Track Page View constructor
     * @constructor
     */
    var TrackPageView = core.command.Command.extend({

        /**
         * Execute Command
         * @param {object} options options object
         * @param {string} options.uri uri uri to track
         */
        execute: function(options) {
            //track in google analytics
            //replace ';' with '--' for ga since can't handle it
            var gaUri = options.uri.replace(/;/g, '--');
            _gaq.push(['_trackPageview', gaUri]);
            return true;
        }
    });

    return {
        TrackPageView: TrackPageView
    };
});
